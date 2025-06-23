'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Users,
  Target
} from 'lucide-react';

interface FormularioResultado {
  nome: string;
  respostas: number;
  mediaGeral: number;
  perguntas: {
    pergunta: string;
    media: number;
    distribuicao: { valor: number; quantidade: number; }[];
  }[];
}

export default function DashboardResultados() {
  const [formularioSelecionado, setFormularioSelecionado] = useState('satisfacao');

  const formularios: FormularioResultado[] = [
    {
      nome: 'Pesquisa de Satisfação - Q1 2024',
      respostas: 45,
      mediaGeral: 3.8,
      perguntas: [
        {
          pergunta: 'Como você avalia o ambiente de trabalho?',
          media: 4.2,
          distribuicao: [
            { valor: 1, quantidade: 2 },
            { valor: 2, quantidade: 3 },
            { valor: 3, quantidade: 8 },
            { valor: 4, quantidade: 18 },
            { valor: 5, quantidade: 14 }
          ]
        },
        {
          pergunta: 'Você se sente motivado em suas tarefas diárias?',
          media: 3.6,
          distribuicao: [
            { valor: 1, quantidade: 3 },
            { valor: 2, quantidade: 5 },
            { valor: 3, quantidade: 12 },
            { valor: 4, quantidade: 15 },
            { valor: 5, quantidade: 10 }
          ]
        },
        {
          pergunta: 'A comunicação da equipe é eficiente?',
          media: 3.4,
          distribuicao: [
            { valor: 1, quantidade: 4 },
            { valor: 2, quantidade: 7 },
            { valor: 3, quantidade: 14 },
            { valor: 4, quantidade: 12 },
            { valor: 5, quantidade: 8 }
          ]
        }
      ]
    },
    {
      nome: 'Avaliação de Treinamento',
      respostas: 23,
      mediaGeral: 4.3,
      perguntas: [
        {
          pergunta: 'O conteúdo do treinamento foi relevante?',
          media: 4.5,
          distribuicao: [
            { valor: 1, quantidade: 0 },
            { valor: 2, quantidade: 1 },
            { valor: 3, quantidade: 3 },
            { valor: 4, quantidade: 8 },
            { valor: 5, quantidade: 11 }
          ]
        },
        {
          pergunta: 'O instrutor demonstrou domínio do assunto?',
          media: 4.1,
          distribuicao: [
            { valor: 1, quantidade: 1 },
            { valor: 2, quantidade: 2 },
            { valor: 3, quantidade: 4 },
            { valor: 4, quantidade: 9 },
            { valor: 5, quantidade: 7 }
          ]
        }
      ]
    }
  ];

  const formularioAtual = formularios.find(f => 
    f.nome.toLowerCase().includes(formularioSelecionado)
  ) || formularios[0];

  const chartData = formularioAtual.perguntas.map(p => ({
    pergunta: p.pergunta.substring(0, 30) + '...',
    media: p.media,
    perguntaCompleta: p.pergunta
  }));

  const distribuicaoData = formularioAtual.perguntas[0]?.distribuicao.map(d => ({
    name: `${d.valor} - ${['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'][d.valor - 1]}`,
    value: d.quantidade,
    percentage: Math.round((d.quantidade / formularioAtual.respostas) * 100)
  })) || [];

  const tendenciaData = [
    { mes: 'Jan', satisfacao: 3.2, treinamento: 4.1 },
    { mes: 'Fev', satisfacao: 3.5, treinamento: 4.2 },
    { mes: 'Mar', satisfacao: 3.8, treinamento: 4.3 },
  ];

  const radarData = formularioAtual.perguntas.map(p => ({
    subject: p.pergunta.substring(0, 20) + '...',
    value: p.media,
    fullText: p.pergunta
  }));

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981'];

  const getStatusColor = (media: number) => {
    if (media >= 4.5) return 'text-green-600';
    if (media >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusLabel = (media: number) => {
    if (media >= 4.5) return 'Excelente';
    if (media >= 3.5) return 'Bom';
    if (media >= 2.5) return 'Regular';
    return 'Ruim';
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
          <h1 className="text-3xl font-bold text-gray-900">Dashboard de Resultados</h1>
          <p className="text-gray-600">
            Analise os resultados dos formulários com gráficos e métricas detalhadas.
          </p>
        </div>
        <div className="flex space-x-3">
          <Select value={formularioSelecionado} onValueChange={setFormularioSelecionado}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um formulário" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="satisfacao">Pesquisa de Satisfação - Q1 2024</SelectItem>
              <SelectItem value="treinamento">Avaliação de Treinamento</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar Relatório
          </Button>
        </div>
      </motion.div>

      {/* Overview Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
                <p className="text-2xl font-bold text-gray-900">{formularioAtual.respostas}</p>
              </div>
              <Users className="w-8 h-8 text-brand-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média Geral</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${getStatusColor(formularioAtual.mediaGeral)}`}>
                    {formularioAtual.mediaGeral.toFixed(1)}
                  </p>
                  <Badge 
                    variant="secondary"
                    className={`${getStatusColor(formularioAtual.mediaGeral)} bg-opacity-10`}
                  >
                    {getStatusLabel(formularioAtual.mediaGeral)}
                  </Badge>
                </div>
              </div>
              <Target className="w-8 h-8 text-brand-green" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maior Pontuação</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.max(...formularioAtual.perguntas.map(p => p.media)).toFixed(1)}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Perguntas</p>
                <p className="text-2xl font-bold text-gray-900">{formularioAtual.perguntas.length}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart - Média por Pergunta */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Média por Pergunta</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="pergunta" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${Number(value).toFixed(1)}`,
                      'Média'
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.perguntaCompleta || label;
                    }}
                  />
                  <Bar dataKey="media" fill="#73C24F" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pie Chart - Distribuição de Respostas */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Distribuição de Respostas</CardTitle>
              <p className="text-sm text-gray-600">
                {formularioAtual.perguntas[0]?.pergunta}
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distribuicaoData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {distribuicaoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} respostas`, 'Quantidade']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                {distribuicaoData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span>{item.name}</span>
                    </div>
                    <span className="font-medium">{item.value} ({item.percentage}%)</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Line Chart - Tendência */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Tendência ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="satisfacao" 
                    stroke="#73C24F" 
                    strokeWidth={3}
                    name="Satisfação"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="treinamento" 
                    stroke="#337AC7" 
                    strokeWidth={3}
                    name="Treinamento"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart - Visão Geral */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <Card className="glass-card">
            <CardHeader>
              <CardTitle>Análise Radar</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis domain={[0, 5]} tick={false} />
                  <Radar
                    name="Pontuação"
                    dataKey="value"
                    stroke="#337AC7"
                    fill="#337AC7"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      `${Number(value).toFixed(1)}`,
                      'Pontuação'
                    ]}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      return item?.fullText || label;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Results Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Resultados Detalhados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Pergunta</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Média</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">Distribuição</th>
                  </tr>
                </thead>
                <tbody>
                  {formularioAtual.perguntas.map((pergunta, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{  opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="border-b border-gray-100 hover:bg-white/30 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 max-w-xs">
                        {pergunta.pergunta}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-lg font-bold ${getStatusColor(pergunta.media)}`}>
                          {pergunta.media.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Badge 
                          variant="secondary"
                          className={`${getStatusColor(pergunta.media)} bg-opacity-10`}
                        >
                          {getStatusLabel(pergunta.media)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex space-x-1">
                          {pergunta.distribuicao.map((dist, idx) => (
                            <div
                              key={idx}
                              className="w-8 h-6 rounded text-xs flex items-center justify-center text-white font-medium"
                              style={{ backgroundColor: COLORS[idx] }}
                            >
                              {dist.quantidade}
                            </div>
                          ))}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}