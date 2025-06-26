'use client';

import {useState, useEffect, useCallback} from 'react';
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
  Eye,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import {toast} from 'sonner';
import {useAuth} from '@/contexts/AuthContext';
import {useLoading} from '@/contexts/LoadingContext';
import {formularioService} from '@/services/formulario';
import {funcionarioService} from '@/services/funcionario';
import {respostaService} from '@/services/resposta';
import {perguntaService} from '@/services/pergunta';
import {testSupabaseConnection} from '@/lib/supabase';
import type {Formulario, Funcionario, Resposta, Pergunta} from '@/lib/supabase';

interface RespostaCompleta {
  id: string;
  formulario_id: string;
  funcionario_id: string;
  pergunta_id: string;
  valor: number;
  created_at: string;
  formulario: Formulario;
  funcionario: Funcionario;
  pergunta: Pergunta;
}

interface FuncionarioStatus {
  id: string;
  nome: string;
  email: string;
  cargo: string;
  setor: string;
  status: 'respondeu' | 'nao_respondeu';
  dataResposta?: string;
}

export default function ControleRespostas() {
  const [filtroFormulario, setFiltroFormulario] = useState('todos');
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [filtroSetor, setFiltroSetor] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [formularios, setFormularios] = useState<Formulario[]>([]);
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [respostas, setRespostas] = useState<RespostaCompleta[]>([]);
  const [funcionariosStatus, setFuncionariosStatus] = useState<FuncionarioStatus[]>([]);
  const [formularioSelecionado, setFormularioSelecionado] = useState<string>('todos');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const {user, empresaId} = useAuth();
  const {setLoading} = useLoading();

  // Test connection on mount
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testSupabaseConnection();
      if (!isConnected) {
        setConnectionError('Não foi possível conectar ao servidor. Verifique sua conexão com a internet.');
      } else {
        setConnectionError(null);
      }
    };

    checkConnection();
  }, []);

  // Load initial data - only depends on user and empresaId
  useEffect(() => {
    if (!user || !empresaId) return;

    let isMounted = true;

    const loadInitialData = async () => {
      setIsInitialLoading(true);
      setLoading(true);
      setConnectionError(null);

      try {

        const [formulariosData, funcionariosData] = await Promise.all([
          formularioService.getByEmpresaId(empresaId),
          funcionarioService.getByEmpresaId(empresaId)
        ]);

        if (!isMounted) return;

        setFormularios(formulariosData || []);
        setFuncionarios(funcionariosData?.filter(f => f.status === 'ativo') || []);
        setRetryCount(0);

      } catch (error: any) {
        if (!isMounted) return;

        console.error('Error loading initial data:', error);

        const errorMessage = error.message || 'Erro ao carregar dados';
        setConnectionError(errorMessage);
        toast.error(errorMessage);
      } finally {
        if (isMounted) {
          setIsInitialLoading(false);
          setLoading(false);
        }
      }
    };

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, [user, empresaId]); // Only these dependencies

  // Load responses when form is selected - separate effect
  useEffect(() => {
    if (formularioSelecionado === 'todos' || isInitialLoading || connectionError || formularios.length === 0 || funcionarios.length === 0) {
      setRespostas([]);
      setFuncionariosStatus([]);
      return;
    }

    let isMounted = true;

    const loadRespostasFormulario = async () => {
      setLoading(true);
      try {
        const [respostasData, perguntasData] = await Promise.all([
          respostaService.getByFormularioId(formularioSelecionado),
          perguntaService.getByFormularioId(formularioSelecionado)
        ]);

        if (!isMounted) return;

        const formulario = formularios.find(f => f.id === formularioSelecionado);

        if (!formulario) return;

        // Create complete responses with related data
        const respostasCompletas: RespostaCompleta[] = respostasData.map(resposta => {
          const funcionario = funcionarios.find(f => f.id === resposta.funcionario_id);
          const pergunta = perguntasData.find(p => p.id === resposta.pergunta_id);

          return {
            ...resposta,
            formulario,
            funcionario: funcionario!,
            pergunta: pergunta!
          };
        }).filter(r => r.funcionario && r.pergunta);

        setRespostas(respostasCompletas);

        // Create employee status
        const funcionariosComStatus: FuncionarioStatus[] = funcionarios.map(funcionario => {
          const respondeu = respostasData.some(r => r.funcionario_id === funcionario.id);
          const primeiraResposta = respostasData.find(r => r.funcionario_id === funcionario.id);

          return {
            id: funcionario.id,
            nome: funcionario.nome,
            email: funcionario.email,
            cargo: funcionario.cargo,
            setor: funcionario.setor,
            status: respondeu ? 'respondeu' : 'nao_respondeu',
            dataResposta: primeiraResposta?.created_at
          };
        });

        setFuncionariosStatus(funcionariosComStatus);

      } catch (error: any) {
        if (!isMounted) return;

        const errorMessage = error.message || 'Erro ao carregar respostas';
        toast.error(errorMessage);
        console.error(error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadRespostasFormulario();

    return () => {
      isMounted = false;
    };
  }, [formularioSelecionado, formularios, funcionarios]); // Removed setLoading from dependencies

  const handleRetry = useCallback(() => {
    setRetryCount(prev => prev + 1);
    // Force reload by clearing data and triggering useEffect
    setFormularios([]);
    setFuncionarios([]);
    setConnectionError(null);
  }, []);

  // Get unique sectors for filter
  const setoresUnicos = Array.from(new Set(funcionarios.map(f => f.setor))).sort();

  const filteredRespostas = respostas.filter(resposta => {
    const matchesStatus = filtroStatus === 'todos' ||
      (filtroStatus === 'completa' && resposta.valor > 0);
    const matchesSearch = resposta.funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resposta.funcionario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = filtroSetor === 'todos' || resposta.funcionario.setor === filtroSetor;

    return matchesStatus && matchesSearch && matchesSetor;
  });

  const filteredFuncionarios = funcionariosStatus.filter(funcionario => {
    const matchesStatus = filtroStatus === 'todos' ||
      (filtroStatus === 'respondeu' && funcionario.status === 'respondeu') ||
      (filtroStatus === 'nao_respondeu' && funcionario.status === 'nao_respondeu');
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      funcionario.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSetor = filtroSetor === 'todos' || funcionario.setor === filtroSetor;

    return matchesStatus && matchesSearch && matchesSetor;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'respondeu':
        return <Badge className="bg-green-100 text-green-800">Respondeu</Badge>;
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
    totalRespostas: filteredRespostas.length,
    funcionariosQueResponderam: filteredFuncionarios.filter(f => f.status === 'respondeu').length,
    funcionariosQueNaoResponderam: filteredFuncionarios.filter(f => f.status === 'nao_respondeu').length,
    totalFuncionarios: filteredFuncionarios.length
  };

  const handleExportData = () => {
    toast.success('Funcionalidade de exportação será implementada em breve');
  };

  // Show connection error state
  if (connectionError && isInitialLoading) {
    return (
      <div className="space-y-8">
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          className="space-y-2"
        >
          <h1 className="text-3xl font-bold text-foreground">Controle de Respostas</h1>
          <p className="text-gray-600">
            Monitore quem respondeu os formulários e acompanhe o progresso em tempo real.
          </p>
        </motion.div>

        <Card className="card">
          <CardContent className="p-8 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4"/>
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Erro de Conexão
            </h3>
            <p className="text-gray-600 mb-4">
              {connectionError}
            </p>
            <Button onClick={handleRetry} className="flex items-center space-x-2">
              <RefreshCw className="w-4 h-4"/>
              <span>Tentar Novamente</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-foreground">Controle de Respostas</h1>
        <p className="text-gray-600">
          Monitore quem respondeu os formulários e acompanhe o progresso em tempo real.
        </p>
        {connectionError && (
          <div className="flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
            <AlertCircle className="w-4 h-4"/>
            <span className="text-sm">{connectionError}</span>
            <Button variant="ghost" size="sm" onClick={handleRetry}>
              <RefreshCw className="w-4 h-4"/>
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.2}}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalRespostas}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-brand-blue"/>
            </div>
          </CardContent>
        </Card>

        <Card className="card">
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

        <Card className="card">
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

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Resposta</p>
                <p className="text-2xl font-bold text-brand-green">
                  {stats.totalFuncionarios > 0 ? `${Math.round((stats.funcionariosQueResponderam / stats.totalFuncionarios) * 100)}%` : "0%"}
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
        <Card className="card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5"/>
              <span>Filtros</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="size-4 absolute left-3 top-3 text-gray-400"/>
                <Input
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={formularioSelecionado} onValueChange={setFormularioSelecionado}>
                <SelectTrigger>
                  <SelectValue placeholder="Formulário"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Selecione um Formulário</SelectItem>
                  {formularios.map((form) => (
                    <SelectItem key={form.id} value={form.id}>
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
                  <SelectItem value="respondeu">Respondeu</SelectItem>
                  <SelectItem value="nao_respondeu">Não Respondeu</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroSetor} onValueChange={setFiltroSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Setor"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Setores</SelectItem>
                  {setoresUnicos.map((setor) => (
                    <SelectItem key={setor} value={setor}>
                      {setor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                onClick={handleExportData}
                variant="outline"
                className="w-full"
              >
                <Download className="size-4 mr-2"/>
                Exportar
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Content */}
      {formularioSelecionado === 'todos' ? (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.6}}
        >
          <Card className="card">
            <CardContent className="p-8 text-center">
              <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4"/>
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Selecione um Formulário
              </h3>
              <p className="text-gray-600">
                Escolha um formulário nos filtros acima para visualizar as respostas e o status dos funcionários.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.6}}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Respostas Recebidas */}
          <Card className="card">
            <CardHeader>
              <CardTitle>Respostas Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRespostas.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                    <p className="text-gray-600">Nenhuma resposta encontrada</p>
                  </div>
                ) : (
                  // Group responses by employee
                  Object.values(
                    filteredRespostas.reduce((acc, resposta) => {
                      const funcionarioId = resposta.funcionario_id;
                      if (!acc[funcionarioId]) {
                        acc[funcionarioId] = {
                          funcionario: resposta.funcionario,
                          formulario: resposta.formulario,
                          respostas: [],
                          dataResposta: resposta.created_at
                        };
                      }
                      acc[funcionarioId].respostas.push(resposta);
                      return acc;
                    }, {} as any)
                  ).map((grupo: any, index) => (
                    <motion.div
                      key={grupo.funcionario.id}
                      initial={{opacity: 0, y: 10}}
                      animate={{opacity: 1, y: 0}}
                      transition={{delay: 0.1 * index}}
                      className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-foreground">{grupo.funcionario.nome}</h4>
                          <p className="text-sm text-gray-600">{grupo.funcionario.email}</p>
                          <p className="text-sm text-gray-600">{grupo.funcionario.cargo} - {grupo.funcionario.setor}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge className="bg-green-100 text-green-800">Completa</Badge>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4"/>
                          </Button>
                        </div>
                      </div>

                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Formulário: {grupo.formulario.nome}
                        </p>
                        <p className="text-xs text-gray-500">
                          Respondido em: {new Date(grupo.dataResposta).toLocaleDateString('pt-BR')}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600">
                        <p className="font-medium mb-1">Resumo das Respostas:</p>
                        <div className="space-y-1">
                          {grupo.respostas.slice(0, 2).map((r: any, index: number) => (
                            <div key={index} className="flex justify-between">
                              <span className="truncate mr-2">{r.pergunta.texto}</span>
                              <span className="font-medium">{getRespostaLabel(r.valor)}</span>
                            </div>
                          ))}
                          {grupo.respostas.length > 2 && (
                            <p className="text-gray-500 italic">
                              ... e mais {grupo.respostas.length - 2} resposta(s)
                            </p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status dos Funcionários */}
          <Card className="card">
            <CardHeader>
              <CardTitle>Status dos Funcionários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredFuncionarios.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                    <p className="text-gray-600">Nenhum funcionário encontrado</p>
                  </div>
                ) : (
                  filteredFuncionarios.map((funcionario, index) => (
                    <motion.div
                      key={funcionario.id}
                      initial={{opacity: 0, x: -10}}
                      animate={{opacity: 1, x: 0}}
                      transition={{delay: 0.05 * index}}
                      className="flex justify-between items-center p-3 rounded-lg hover:bg-white/30 transition-colors"
                    >
                      <div>
                        <p className="font-medium text-foreground">{funcionario.nome}</p>
                        <p className="text-sm text-gray-600">{funcionario.email}</p>
                        <p className="text-sm text-gray-600">{funcionario.cargo} - {funcionario.setor}</p>
                        {funcionario.dataResposta && (
                          <p className="text-xs text-gray-500">
                            Respondeu em: {new Date(funcionario.dataResposta).toLocaleDateString('pt-BR')}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(funcionario.status)}
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}