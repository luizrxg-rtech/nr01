'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileSpreadsheet,
  Users,
  Download,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye,
  Plus,
  Edit
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { funcionarioService } from '@/services/funcionario';
import type { Funcionario } from '@/lib/supabase';

export default function GerenciarFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<Funcionario | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    cargo: '',
    setor: '',
    cpf: '',
    email: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, empresaId } = useAuth();
  const { setLoading } = useLoading();

  useEffect(() => {
    if (user && empresaId) {
      loadFuncionarios();
    }
  }, [user, empresaId]);

  const loadFuncionarios = async () => {
    if (!empresaId) return;

    setLoading(true);
    try {
      const funcionariosData = await funcionarioService.getByEmpresaId(empresaId);
      setFuncionarios(funcionariosData);
    } catch (error: any) {
      toast.error('Erro ao carregar funcionários');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!empresaId) {
      toast.error('Empresa não identificada');
      return;
    }

    setIsUploading(true);

    try {
      // Read file content
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
        setIsUploading(false);
        return;
      }

      // Parse CSV (assuming comma-separated)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const funcionariosData: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        
        if (values.length >= 5) {
          funcionariosData.push({
            empresa_id: empresaId,
            nome: values[0] || '',
            cargo: values[1] || '',
            setor: values[2] || '',
            cpf: values[3] || '',
            email: values[4] || '',
            status: 'ativo'
          });
        }
      }

      if (funcionariosData.length === 0) {
        toast.error('Nenhum funcionário válido encontrado no arquivo');
        setIsUploading(false);
        return;
      }

      // Save to database
      await funcionarioService.createMany(funcionariosData);
      
      // Reload data
      await loadFuncionarios();
      
      setUploadSuccess(true);
      toast.success(`${funcionariosData.length} funcionários importados com sucesso!`);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Hide success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + (error.message || 'Erro desconhecido'));
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      ["Nome", "Cargo", "Setor", "CPF", "Email"],
      ["João Silva", "Analista", "TI", "123.456.789-00", "joao@empresa.com"],
      ["Maria Santos", "Gerente", "RH", "987.654.321-00", "maria@empresa.com"]
    ];

    const csvContent = data.map(row =>
      row.map(cell => `"${cell}"`).join(',')
    ).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_funcionarios.csv';
    link.click();
    window.URL.revokeObjectURL(url);

    toast.success('Template baixado com sucesso!');
  };

  const handleAddFuncionario = () => {
    setShowAddForm(true);
    setEditingFuncionario(null);
    setFormData({
      nome: '',
      cargo: '',
      setor: '',
      cpf: '',
      email: ''
    });
  };

  const handleEditFuncionario = (funcionario: Funcionario) => {
    setShowAddForm(true);
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      cargo: funcionario.cargo,
      setor: funcionario.setor,
      cpf: funcionario.cpf,
      email: funcionario.email
    });
  };

  const handleSaveFuncionario = async () => {
    if (!empresaId) {
      toast.error('Empresa não identificada');
      return;
    }

    if (!formData.nome || !formData.cargo || !formData.setor || !formData.cpf || !formData.email) {
      toast.error('Todos os campos são obrigatórios');
      return;
    }

    setIsSubmitting(true);

    try {
      const funcionarioData = {
        empresa_id: empresaId,
        nome: formData.nome.trim(),
        cargo: formData.cargo.trim(),
        setor: formData.setor.trim(),
        cpf: formData.cpf.replace(/\D/g, ''),
        email: formData.email.trim(),
        status: 'ativo' as const
      };

      if (editingFuncionario) {
        await funcionarioService.update(editingFuncionario.id, funcionarioData);
        toast.success('Funcionário atualizado com sucesso!');
      } else {
        await funcionarioService.create(funcionarioData);
        toast.success('Funcionário cadastrado com sucesso!');
      }

      await loadFuncionarios();
      setShowAddForm(false);
      setEditingFuncionario(null);
      setFormData({
        nome: '',
        cargo: '',
        setor: '',
        cpf: '',
        email: ''
      });

    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar funcionário');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFuncionario = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este funcionário?')) {
      return;
    }

    try {
      await funcionarioService.delete(id);
      setFuncionarios(prev => prev.filter(f => f.id !== id));
      toast.success('Funcionário removido com sucesso!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao remover funcionário');
      console.error(error);
    }
  };

  const handleToggleStatus = async (funcionario: Funcionario) => {
    const novoStatus = funcionario.status === 'ativo' ? 'inativo' : 'ativo';
    
    try {
      await funcionarioService.update(funcionario.id, { status: novoStatus });
      setFuncionarios(prev => prev.map(f =>
        f.id === funcionario.id ? { ...f, status: novoStatus } : f
      ));
      toast.success(`Funcionário ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso!`);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao atualizar status do funcionário');
      console.error(error);
    }
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .substring(0, 14);
  };

  const stats = {
    total: funcionarios.length,
    ativos: funcionarios.filter(f => f.status === 'ativo').length,
    inativos: funcionarios.filter(f => f.status === 'inativo').length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Funcionários</h1>
          <p className="text-gray-600">
            Importe dados de funcionários via planilha ou gerencie individualmente.
          </p>
        </div>
        <Button
          onClick={handleAddFuncionario}
          className="brand-gradient hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Funcionário
        </Button>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Upload className="w-5 h-5 text-brand-blue" />
              <span>Importar Funcionários</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {uploadSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center space-x-2 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-800 font-medium">
                  Funcionários importados com sucesso!
                </span>
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Planilha de Funcionários</Label>
                  <div className="mt-2">
                    <Input
                      ref={fileInputRef}
                      id="file-upload"
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Aceita arquivos CSV, XLSX ou XLS
                  </p>
                </div>

                {isUploading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center space-x-2 text-brand-blue"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full"
                    />
                    <span>Processando planilha...</span>
                  </motion.div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Formato da Planilha:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• Nome: Nome completo do funcionário</li>
                        <li>• Cargo: Cargo ou função</li>
                        <li>• Setor: Setor do qual o funcionário faz parte</li>
                        <li>• CPF: Documento com pontuação</li>
                        <li>• Email: Email corporativo</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="w-full"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Template
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Funcionários</p>
                <p className="text-2xl font-bold text-foreground">{stats.total}</p>
              </div>
              <Users className="w-8 h-8 text-brand-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">{stats.inativos}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>
                {editingFuncionario ? 'Editar Funcionário' : 'Novo Funcionário'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo *</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo: e.target.value }))}
                    placeholder="Ex: Analista, Gerente"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setor">Setor *</Label>
                  <Input
                    id="setor"
                    value={formData.setor}
                    onChange={(e) => setFormData(prev => ({ ...prev, setor: e.target.value }))}
                    placeholder="Ex: TI, RH, Financeiro"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpf">CPF *</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf}
                    onChange={(e) => {
                      const formatted = formatCPF(e.target.value);
                      setFormData(prev => ({ ...prev, cpf: formatted }));
                    }}
                    placeholder="000.000.000-00"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="funcionario@empresa.com"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSaveFuncionario}
                  disabled={isSubmitting}
                  className="brand-gradient hover:opacity-90 transition-opacity"
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                    />
                  ) : null}
                  {isSubmitting ? 'Salvando...' : (editingFuncionario ? 'Atualizar' : 'Cadastrar')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Funcionários List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-green" />
              <span>Lista de Funcionários</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {funcionarios.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum funcionário encontrado</p>
                <p className="text-sm text-gray-500">Adicione funcionários individualmente ou importe via planilha</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-foreground">Nome</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Cargo</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Setor</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">CPF</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Email</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {funcionarios.map((funcionario, index) => (
                      <motion.tr
                        key={funcionario.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        className="border-b border-gray-100 hover:bg-white/30 transition-colors"
                      >
                        <td className="py-3 px-4 font-medium text-foreground">
                          {funcionario.nome}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {funcionario.cargo}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {funcionario.setor}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {formatCPF(funcionario.cpf)}
                        </td>
                        <td className="py-3 px-4 text-gray-600">
                          {funcionario.email}
                        </td>
                        <td className="py-3 px-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleStatus(funcionario)}
                          >
                            <Badge
                              variant={funcionario.status === 'ativo' ? 'default' : 'secondary'}
                              className={funcionario.status === 'ativo'
                                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                              }
                            >
                              {funcionario.status}
                            </Badge>
                          </Button>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFuncionario(funcionario)}
                              className="text-brand-blue hover:text-brand-blue-dark"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteFuncionario(funcionario.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}