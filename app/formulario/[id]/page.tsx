'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send,
  User,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { formularioService } from '@/services/formulario';
import { perguntaService } from '@/services/pergunta';
import { respostaService } from '@/services/resposta';
import { funcionarioService } from '@/services/funcionario';
import type { Formulario, Pergunta, Funcionario } from '@/lib/supabase';

const respostaOptions = [
  { value: '1', label: '1 - Nunca', color: 'text-red-600' },
  { value: '2', label: '2 - Raramente', color: 'text-orange-600' },
  { value: '3', label: '3 - Às vezes', color: 'text-yellow-600' },
  { value: '4', label: '4 - Frequentemente', color: 'text-green-600' },
  { value: '5', label: '5 - Sempre', color: 'text-green-700' }
];

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export default function ResponderFormulario({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [formulario, setFormulario] = useState<Formulario | null>(null);
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [funcionarioId, setFuncionarioId] = useState('');
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<Funcionario | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate UUID format before making any requests
    if (!isValidUUID(params.id)) {
      setError('ID do formulário inválido. Verifique o link e tente novamente.');
      setIsLoading(false);
      return;
    }

    loadFormularioData();
  }, [params.id]);

  const loadFormularioData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Buscar formulário
      const formularioData = await formularioService.getById(params.id);
      
      if (!formularioData) {
        setError('Formulário não encontrado');
        return;
      }

      if (formularioData.status !== 'ativo') {
        setError('Este formulário não está mais ativo');
        return;
      }

      setFormulario(formularioData);

      // Buscar perguntas do formulário
      const perguntasData = await perguntaService.getByFormularioId(params.id);
      
      if (perguntasData.length === 0) {
        setError('Este formulário não possui perguntas');
        return;
      }

      setPerguntas(perguntasData);

      // Buscar funcionários da empresa
      const funcionariosData = await funcionarioService.getByEmpresaId(formularioData.empresa_id);
      setFuncionarios(funcionariosData.filter(f => f.status === 'ativo'));

    } catch (error: any) {
      console.error('Erro ao carregar formulário:', error);
      setError('Erro ao carregar formulário. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFuncionarioChange = (value: string) => {
    setFuncionarioId(value);
    const funcionario = funcionarios.find(f => f.id === value);
    setFuncionarioSelecionado(funcionario || null);
  };

  const totalQuestions = perguntas.length;
  const progress = totalQuestions > 0 ? ((currentQuestion + 1) / totalQuestions) * 100 : 0;
  const currentPergunta = perguntas[currentQuestion];

  const handleAnswerChange = (value: string) => {
    if (!currentPergunta) return;
    
    setRespostas(prev => ({
      ...prev,
      [currentPergunta.id]: value
    }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!funcionarioId) {
      toast.error('Por favor, selecione um funcionário.');
      return;
    }

    // Verificar se todas as perguntas foram respondidas
    const unansweredQuestions = perguntas.filter(
      p => !respostas[p.id]
    );

    if (unansweredQuestions.length > 0) {
      toast.error('Por favor, responda todas as perguntas antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Verificar se o funcionário já respondeu este formulário
      const respostasExistentes = await respostaService.getByFuncionarioAndFormulario(
        funcionarioId, 
        params.id
      );

      if (respostasExistentes.length > 0) {
        toast.error('Você já respondeu este formulário.');
        setIsSubmitting(false);
        return;
      }

      // Preparar dados das respostas
      const respostasData = perguntas.map(pergunta => ({
        formulario_id: params.id,
        funcionario_id: funcionarioId,
        pergunta_id: pergunta.id,
        valor: parseInt(respostas[pergunta.id])
      }));

      // Salvar respostas
      await respostaService.createMany(respostasData);

      setIsCompleted(true);
      toast.success('Respostas enviadas com sucesso!');
    } catch (error: any) {
      console.error('Erro ao salvar respostas:', error);
      toast.error('Erro ao enviar respostas. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card p-8 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-4 border-brand-blue border-t-transparent rounded-full mx-auto mb-4"
          />
          <p className="text-gray-600">Carregando formulário...</p>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="card p-8 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Ops! Algo deu errado
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <Button onClick={() => router.push('/')}>
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  // Success state
  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="card p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-8 h-8 text-green-600" />
            </motion.div>

            <h2 className="text-2xl font-bold text-foreground mb-4">
              Obrigado pela sua participação!
            </h2>

            <p className="text-gray-600 mb-6">
              Suas respostas foram enviadas com sucesso. Elas são muito importantes
              para nos ajudar a melhorar continuamente.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Formulário:</strong> {formulario?.nome}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Funcionário:</strong> {funcionarioSelecionado?.nome}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Perguntas respondidas:</strong> {totalQuestions}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Data:</strong> {new Date().toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="card">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">
                    {formulario?.nome}
                  </CardTitle>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Pergunta {currentQuestion + 1} de {totalQuestions}</span>
                  <span>{Math.round(progress)}% concluído</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Seleção de Funcionário */}
        {!funcionarioSelecionado && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-brand-blue" />
                  <span>Identificação</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="funcionario">Selecione seu nome *</Label>
                    <select
                      id="funcionario"
                      value={funcionarioId}
                      onChange={(e) => handleFuncionarioChange(e.target.value)}
                      className="w-full mt-2 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-brand-blue"
                    >
                      <option value="">Selecione seu nome...</option>
                      {funcionarios.map((funcionario) => (
                        <option key={funcionario.id} value={funcionario.id}>
                          {funcionario.nome} - {funcionario.cargo}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {funcionarioSelecionado && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Nome:</strong> {funcionarioSelecionado.nome}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Cargo:</strong> {funcionarioSelecionado.cargo}
                      </p>
                      <p className="text-sm text-blue-800">
                        <strong>Setor:</strong> {funcionarioSelecionado.setor}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Card */}
        {funcionarioSelecionado && currentPergunta && (
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="card">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  {currentPergunta.texto}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <RadioGroup
                  value={respostas[currentPergunta.id] || ''}
                  onValueChange={handleAnswerChange}
                  className="space-y-4"
                >
                  {respostaOptions.map((option) => (
                    <motion.div
                      key={option.value}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * parseInt(option.value) }}
                      className="flex items-center space-x-3 p-4 rounded-lg border border-gray-200 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() => handleAnswerChange(option.value)}
                    >
                      <RadioGroupItem value={option.value} id={option.value} />
                      <Label
                        htmlFor={option.value}
                        className={`flex-1 cursor-pointer font-medium ${option.color}`}
                      >
                        {option.label}
                      </Label>
                    </motion.div>
                  ))}
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between pt-6 border-t border-gray-200">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                    className="flex items-center space-x-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Anterior</span>
                  </Button>

                  {currentQuestion === totalQuestions - 1 ? (
                    <Button
                      onClick={handleSubmit}
                      disabled={!respostas[currentPergunta.id] || isSubmitting}
                      className="brand-gradient hover:opacity-90 transition-opacity flex items-center space-x-2"
                    >
                      {isSubmitting ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                      <span>{isSubmitting ? 'Enviando...' : 'Enviar Respostas'}</span>
                    </Button>
                  ) : (
                    <Button
                      onClick={handleNext}
                      disabled={!respostas[currentPergunta.id]}
                      className="brand-gradient hover:opacity-90 transition-opacity flex items-center space-x-2"
                    >
                      <span>Próxima</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Question Overview */}
        {funcionarioSelecionado && perguntas.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8"
          >
            <Card className="card">
              <CardContent className="p-4">
                <div className="flex flex-wrap gap-2">
                  {perguntas.map((pergunta, index) => (
                    <button
                      key={pergunta.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                        index === currentQuestion
                          ? 'bg-brand-blue text-white'
                          : respostas[pergunta.id]
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Clique nos números para navegar entre as perguntas
                </p>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}