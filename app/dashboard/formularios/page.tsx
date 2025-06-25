'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  FileText,
  Edit,
  Trash2,
  Eye,
  Save,
  X,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { formularioService } from '@/services/formulario';
import { perguntaService } from '@/services/pergunta';
import type { Formulario, Pergunta } from '@/lib/supabase';

interface FormData {
  nome: string;
  perguntas: { id: number; texto: string }[];
}

interface FormularioComPerguntas extends Formulario {
  perguntas: Pergunta[];
  respostas: number;
}

export default function GerenciarFormularios() {
  const [showForm, setShowForm] = useState(false);
  const [editingForm, setEditingForm] = useState<FormularioComPerguntas | null>(null);
  const [formularios, setFormularios] = useState<FormularioComPerguntas[]>([]);
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    perguntas: [{ id: 1, texto: '' }]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { user, empresaId } = useAuth();
  const { setLoading } = useLoading();

  useEffect(() => {
    if (user && empresaId) {
      loadFormularios();
    }
  }, [user, empresaId]);

  const loadFormularios = async () => {
    if (!empresaId) return;

    setLoading(true);
    try {
      const formulariosData = await formularioService.getByEmpresaId(empresaId);
      
      // Carregar perguntas para cada formulário
      const formulariosComPerguntas = await Promise.all(
        formulariosData.map(async (formulario) => {
          const perguntas = await perguntaService.getByFormularioId(formulario.id);
          return {
            ...formulario,
            perguntas,
            respostas: 0 // TODO: Implementar contagem de respostas quando necessário
          };
        })
      );

      setFormularios(formulariosComPerguntas);
    } catch (error: any) {
      toast.error('Erro ao carregar formulários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setShowForm(true);
    setEditingForm(null);
    setFormData({
      nome: '',
      perguntas: [{ id: 1, texto: '' }]
    });
  };

  const handleEditForm = (formulario: FormularioComPerguntas) => {
    setShowForm(true);
    setEditingForm(formulario);
    setFormData({
      nome: formulario.nome,
      perguntas: formulario.perguntas.map((p, index) => ({
        id: index + 1,
        texto: p.texto
      }))
    });
  };

  const handleAddPergunta = () => {
    const newId = Math.max(...formData.perguntas.map(p => p.id)) + 1;
    setFormData(prev => ({
      ...prev,
      perguntas: [...prev.perguntas, { id: newId, texto: '' }]
    }));
  };

  const handleRemovePergunta = (id: number) => {
    if (formData.perguntas.length > 1) {
      setFormData(prev => ({
        ...prev,
        perguntas: prev.perguntas.filter(p => p.id !== id)
      }));
    }
  };

  const handleUpdatePergunta = (id: number, texto: string) => {
    setFormData(prev => ({
      ...prev,
      perguntas: prev.perguntas.map(p => 
        p.id === id ? { ...p, texto } : p
      )
    }));
  };

  const handleSaveForm = async () => {
    if (!empresaId) {
      toast.error('Empresa não identificada');
      return;
    }

    if (!formData.nome.trim()) {
      toast.error('Nome do formulário é obrigatório');
      return;
    }

    const perguntasValidas = formData.perguntas.filter(p => p.texto.trim());
    if (perguntasValidas.length === 0) {
      toast.error('Pelo menos uma pergunta é obrigatória');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingForm) {
        // Atualizar formulário existente
        const formularioAtualizado = await formularioService.update(editingForm.id, {
          nome: formData.nome.trim()
        });

        // Deletar perguntas antigas
        await perguntaService.deleteByFormularioId(editingForm.id);

        // Criar novas perguntas
        const perguntasData = perguntasValidas.map((pergunta, index) => ({
          formulario_id: editingForm.id,
          texto: pergunta.texto.trim(),
          ordem: index + 1
        }));

        const novasPerguntas = await perguntaService.createMany(perguntasData);

        // Atualizar estado local
        setFormularios(prev => prev.map(f => 
          f.id === editingForm.id 
            ? { ...formularioAtualizado, perguntas: novasPerguntas, respostas: f.respostas }
            : f
        ));

        toast.success('Formulário atualizado com sucesso!');
      } else {
        // Criar novo formulário
        const novoFormulario = await formularioService.create({
          empresa_id: empresaId,
          nome: formData.nome.trim(),
          status: 'ativo'
        });

        // Criar perguntas
        const perguntasData = perguntasValidas.map((pergunta, index) => ({
          formulario_id: novoFormulario.id,
          texto: pergunta.texto.trim(),
          ordem: index + 1
        }));

        const perguntas = await perguntaService.createMany(perguntasData);

        // Adicionar ao estado local
        const formularioCompleto = {
          ...novoFormulario,
          perguntas,
          respostas: 0
        };

        setFormularios(prev => [formularioCompleto, ...prev]);
        toast.success('Formulário criado com sucesso!');
      }

      setShowForm(false);
      setEditingForm(null);
      setFormData({
        nome: '',
        perguntas: [{ id: 1, texto: '' }]
      });
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar formulário');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteForm = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este formulário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      await formularioService.delete(id);
      setFormularios(prev => prev.filter(f => f.id !== id));
      toast.success('Formulário excluído com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir formulário');
      console.error(error);
    }
  };

  const handleToggleStatus = async (formulario: FormularioComPerguntas) => {
    const novoStatus = formulario.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      const formularioAtualizado = await formularioService.update(formulario.id, {
        status: novoStatus
      });

      setFormularios(prev => prev.map(f =>
        f.id === formulario.id
          ? { ...f, status: formularioAtualizado.status }
          : f
      ));

      toast.success(`Formulário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status do formulário');
      console.error(error);
    }
  };

  const stats = {
    total: formularios.length,
    ativos: formularios.filter(f => f.status === 'ativo').length,
    totalRespostas: formularios.reduce((acc, f) => acc + f.respostas, 0)
  };

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-start"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Formulários</h1>
            <p className="text-gray-600">
              Crie, edite e gerencie formulários personalizados para sua empresa.
            </p>
          </div>
          <Button
            onClick={handleCreateForm}
            className="brand-gradient hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Formulário
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Formulários</p>
                  <p className="text-2xl font-bold text-foreground">{stats.total}</p>
                </div>
                <FileText className="w-8 h-8 text-brand-blue" />
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Formulários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Respostas</p>
                  <p className="text-2xl font-bold text-brand-green">{stats.totalRespostas}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-brand-green" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Formulários List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>Lista de Formulários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formularios.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum formulário encontrado</p>
                    <p className="text-sm text-gray-500">Clique em "Novo Formulário" para começar</p>
                  </div>
                ) : (
                  formularios.map((formulario, index) => (
                    <motion.div
                      key={formulario.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {formulario.nome}
                            </h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleStatus(formulario)}
                            >
                              <Badge
                                variant={formulario.status === 'ativo' ? 'default' : 'secondary'}
                                className={formulario.status === 'ativo'
                                  ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                }
                              >
                                {formulario.status}
                              </Badge>
                            </Button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">Perguntas:</span> {formulario.perguntas.length}
                            </div>
                            <div>
                              <span className="font-medium">Respostas:</span> {formulario.respostas}
                            </div>
                            <div>
                              <span className="font-medium">Criado em:</span> {new Date(formulario.created_at!).toLocaleDateString('pt-BR')}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-700">Perguntas:</p>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {formulario.perguntas.slice(0, 2).map((pergunta, index) => (
                                <li key={pergunta.id} className="flex items-start">
                                  <span className="mr-2">{index + 1}.</span>
                                  <span>{pergunta.texto}</span>
                                </li>
                              ))}
                              {formulario.perguntas.length > 2 && (
                                <li className="text-gray-500 italic">
                                  ... e mais {formulario.perguntas.length - 2} pergunta(s)
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>

                        <div className="flex space-x-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-brand-blue hover:text-brand-blue-dark"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditForm(formulario)}
                            className="text-brand-green hover:text-brand-green-dark"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteForm(formulario.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Form Creation/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-background max-w-2xl w-full max-h-[90vh] rounded-3xl overflow-hidden"
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-foreground">
                    {editingForm ? 'Editar Formulário' : 'Novo Formulário'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowForm(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col h-full">
                <div className="space-y-6 overflow-y-auto flex-1 max-h-[50vh] p-6">
                  {/* Nome do Formulário */}
                  <div className="space-y-2">
                    <Label htmlFor="nomeFormulario">Nome do Formulário *</Label>
                    <Input
                      id="nomeFormulario"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Pesquisa de Satisfação - Q1 2024"
                    />
                  </div>

                  {/* Perguntas */}
                  <div className="space-y-4">
                    <div className="space-y-4">
                      {formData.perguntas.map((pergunta, index) => (
                        <motion.div
                          key={pergunta.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-4"
                        >
                          {index > 0 && <div className="h-px bg-gray-200"></div>}
                          <div className="flex justify-between items-start">
                            <Label>Pergunta {index + 1}</Label>
                            {formData.perguntas.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemovePergunta(pergunta.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>

                          <Textarea
                            value={pergunta.texto}
                            onChange={(e) => handleUpdatePergunta(pergunta.id, e.target.value)}
                            placeholder="Digite sua pergunta aqui..."
                            rows={2}
                          />
                        </motion.div>
                      ))}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddPergunta}
                      className="w-full"
                    >
                      Adicionar Pergunta
                      <Plus className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveForm}
                    disabled={isSubmitting}
                    className="brand-gradient hover:opacity-90 transition-opacity"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                      />
                    ) : (
                      <Save className="w-4 h-4 mr-2" />
                    )}
                    {isSubmitting ? 'Salvando...' : (editingForm ? 'Atualizar' : 'Criar')} Formulário
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}