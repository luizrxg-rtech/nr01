'use client';

import {useState} from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {Input} from '@/components/ui/input';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {
  MessageSquare,
  Users,
  CheckCircle,
  Clock,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import {Formulario} from "@/lib/supabase";

interface Resposta {
  id: number;
  funcionarioNome: string;
  funcionarioEmail: string;
  formularioNome: string;
  respostas: { pergunta: string; resposta: number; }[];
  status: 'completa' | 'parcial';
  dataResposta: string;
}

interface Funcionario {
  id: number;
  nome: string;
  email: string;
  status: 'respondeu' | 'nao_respondeu' | 'parcial';
}

export default function ControleRespostas() {
  const [filtroFormulario, setFiltroFormulario] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const formularios: Formulario[] = [];

  const respostas: Resposta[] = [];

  const funcionarios: Funcionario[] = [];

  const filteredRespostas = respostas.filter(resposta => {
    const matchesFormulario = filtroFormulario === 'todos' || resposta.formularioNome === filtroFormulario;
    const matchesStatus = filtroStatus === 'todos' || resposta.status === filtroStatus;
    const matchesSearch = resposta.funcionarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resposta.funcionarioEmail.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFormulario && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'respondeu':
      case 'completa':
        return <Badge className="bg-green-100 text-green-800">Completa</Badge>;
      case 'parcial':
        return <Badge className="bg-yellow-100 text-yellow-800">Parcial</Badge>;
      case 'nao_respondeu':
        return <Badge className="bg-red-100 text-red-800">Não Respondeu</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getRespostaLabel = (valor: number) => {
    const labels = {
      1: 'Nunca',
      2: 'Raramente',
      3: 'Às vezes',
      4: 'Frequentemente',
      5: 'Sempre'
    };
    return labels[valor as keyof typeof labels] || valor.toString();
  };

  const stats = {
    totalRespostas: respostas.length,
    respostasCompletas: respostas.filter(r => r.status === 'completa').length,
    respostasParciais: respostas.filter(r => r.status === 'parcial').length,
    funcionariosQueResponderam: funcionarios.filter(f => f.status === 'respondeu').length,
    funcionariosQueNaoResponderam: funcionarios.filter(f => f.status === 'nao_respondeu').length
  };

  const handleExportData = () => {
    // Mock export functionality
    console.log('Exportando dados...');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900">Controle de Respostas</h1>
        <p className="text-gray-600">
          Monitore quem respondeu os formulários e acompanhe o progresso em tempo real.
        </p>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.2}}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalRespostas}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-brand-blue"/>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Responderam</p>
                <p className="text-2xl font-bold text-green-600">{stats.funcionariosQueResponderam}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600"/>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Não Responderam</p>
                <p className="text-2xl font-bold text-red-600">{stats.funcionariosQueNaoResponderam}</p>
              </div>
              <Clock className="w-8 h-8 text-red-600"/>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-brand-green">
                  {funcionarios?.length > 0 ? `${Math.round((stats.funcionariosQueResponderam / funcionarios.length) * 100)}%` : "0%"}
                </p>
              </div>
              <Users className="w-8 h-8 text-brand-green"/>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.4}}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5"/>
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400"/>
                <Input
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={filtroFormulario} onValueChange={setFiltroFormulario}>
                <SelectTrigger>
                  <SelectValue placeholder="Formulário"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Formulários</SelectItem>
                  {formularios.map((form, index) => (
                    <SelectItem
                      key={index}
                      value={form.id}
                    >
                      {form.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Status"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="completa">Completa</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full"
              >
                <Download className="w-4 h-4 mr-2"/>
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Overview */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.6}}
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
      >
        {/* Respostas Recebidas */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Respostas Recebidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredRespostas.map((resposta, index) => (
                <motion.div
                  key={resposta.id}
                  initial={{opacity: 0, y: 10}}
                  animate={{opacity: 1, y: 0}}
                  transition={{delay: 0.1 * index}}
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{resposta.funcionarioNome}</h4>
                      <p className="text-sm text-gray-600">{resposta.funcionarioEmail}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(resposta.status)}
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4"/>
                      </Button>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Formulário: {resposta.formularioNome}
                    </p>
                    <p className="text-xs text-gray-500">
                      Respondido em: {new Date(resposta.dataResposta).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p className="font-medium mb-1">Resumo das Respostas:</p>
                    <div className="space-y-1">
                      {resposta.respostas.slice(0, 2).map((r, idx) => (
                        <div key={idx} className="flex justify-between">
                          <span className="truncate mr-2">{r.pergunta}</span>
                          <span className="font-medium">{getRespostaLabel(r.resposta)}</span>
                        </div>
                      ))}
                      {resposta.respostas.length > 2 && (
                        <p className="text-gray-500 italic">
                          ... e mais {resposta.respostas.length - 2} resposta(s)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Status dos Funcionários */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Status dos Funcionários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {funcionarios.map((funcionario, index) => (
                <motion.div
                  key={funcionario.id}
                  initial={{opacity: 0, x: -10}}
                  animate={{opacity: 1, x: 0}}
                  transition={{delay: 0.05 * index}}
                  className="flex justify-between items-center p-3 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{funcionario.nome}</p>
                    <p className="text-sm text-gray-600">{funcionario.email}</p>
                  </div>
                  {getStatusBadge(funcionario.status)}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}