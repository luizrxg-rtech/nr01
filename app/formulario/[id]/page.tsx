'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Send
} from 'lucide-react';
import { toast } from 'sonner';

interface Pergunta {
  id: number;
  texto: string;
}

interface Formulario {
  id: string;
  nome: string;
  perguntas: Pergunta[];
  descricao?: string;
}

// Mock data - in a real app, this would come from an API
const formularios: Record<string, Formulario> = {
  '1': {
    id: '1',
    nome: 'Pesquisa de Satisfação - Q1 2024',
    descricao: 'Avalie sua experiência no ambiente de trabalho e ajude-nos a melhorar continuamente.',
    perguntas: [
      { id: 1, texto: 'Como você avalia o ambiente de trabalho da empresa?' },
      { id: 2, texto: 'Você se sente motivado em suas tarefas diárias?' },
      { id: 3, texto: 'A comunicação entre as equipes é eficiente?' },
      { id: 4, texto: 'Você recebe feedback adequado sobre seu desempenho?' },
      { id: 5, texto: 'As oportunidades de crescimento profissional são claras?' }
    ]
  },
  '2': {
    id: '2',
    nome: 'Avaliação de Treinamento',
    descricao: 'Compartilhe sua opinião sobre o treinamento recém-concluído.',
    perguntas: [
      { id: 1, texto: 'O conteúdo do treinamento foi relevante para suas atividades?' },
      { id: 2, texto: 'O instrutor demonstrou domínio do assunto?' },
      { id: 3, texto: 'Os materiais fornecidos foram adequados?' },
      { id: 4, texto: 'Você aplicaria os conhecimentos adquiridos no trabalho?' }
    ]
  }
};

const respostaOptions = [
  { value: '1', label: '1 - Nunca', color: 'text-red-600' },
  { value: '2', label: '2 - Raramente', color: 'text-orange-600' },
  { value: '3', label: '3 - Às vezes', color: 'text-yellow-600' },
  { value: '4', label: '4 - Frequentemente', color: 'text-green-600' },
  { value: '5', label: '5 - Sempre', color: 'text-green-700' }
];

export default function ResponderFormulario({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [respostas, setRespostas] = useState<Record<number, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const formulario = formularios[params.id];

  if (!formulario) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Formulário não encontrado
          </h2>
          <p className="text-gray-600 mb-6">
            O formulário que você está tentando acessar não existe ou foi removido.
          </p>
          <Button onClick={() => router.push('/')}>
            Voltar ao Início
          </Button>
        </Card>
      </div>
    );
  }

  const totalQuestions = formulario.perguntas.length;
  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const currentPergunta = formulario.perguntas[currentQuestion];

  const handleAnswerChange = (value: string) => {
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
    // Check if all questions are answered
    const unansweredQuestions = formulario.perguntas.filter(
      p => !respostas[p.id]
    );

    if (unansweredQuestions.length > 0) {
      toast.error('Por favor, responda todas as perguntas antes de enviar.');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('Respostas enviadas:', {
      formularioId: formulario.id,
      respostas: respostas
    });

    setIsSubmitting(false);
    setIsCompleted(true);
    toast.success('Respostas enviadas com sucesso!');
  };

  if (isCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full"
        >
          <Card className="glass-card p-8 text-center">
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
                  <strong>Formulário:</strong> {formulario.nome}
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
          <Card className="glass-card">
            <CardHeader>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 brand-gradient rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl text-foreground">
                    {formulario.nome}
                  </CardTitle>
                  {formulario.descricao && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formulario.descricao}
                    </p>
                  )}
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

        {/* Question Card */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="glass-card">
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

        {/* Question Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-8"
        >
          <Card className="glass-card">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                {formulario.perguntas.map((pergunta, index) => (
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
      </div>
    </div>
  );
}