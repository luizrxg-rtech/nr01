'use client';

import {useEffect, useState, useMemo} from 'react';
import {motion} from 'framer-motion';
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card';
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import {Button} from '@/components/ui/button';
import {Badge} from '@/components/ui/badge';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';
import {BarChart3, Download, SearchX, Target, TrendingUp, Users, Filter} from 'lucide-react';
import {toast} from "sonner";
import {useAuth} from "@/contexts/AuthContext";
import {useLoading} from "@/contexts/LoadingContext";
import {Formulario, Funcionario, Pergunta, Resposta} from "@/lib/supabase";
import {funcionarioService} from "@/services/funcionario";
import {respostaService} from "@/services/resposta";
import {formularioService} from "@/services/formulario";
import {perguntaService} from "@/services/pergunta";
import * as XLSX from 'xlsx';

interface Media {
  idPergunta: string;
  valor: number;
}

interface Distribuicao {
  valor: number;
  quantidade: number;
}

interface PerguntasComDistribuicao {
  idPergunta: string;
  distribuicoes: Distribuicao[];
}

interface FormularioComDados {
  formulario: Formulario;
  perguntas: Pergunta[];
  respostas: Resposta[];
  mediaGeral: number;
  totalRespostas: number;
}

export default function DashboardResultados() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [formularios, setFormularios] = useState<Formulario[]>([])
  const [perguntas, setPerguntas] = useState<Pergunta[]>([])
  const [respostas, setRespostas] = useState<Resposta[]>([])
  const [formularioSelecionado, setFormularioSelecionado] = useState<Formulario | null>(null)
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState<string>('todos')
  const [setorSelecionado, setSetorSelecionado] = useState<string>('todos')
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [formulariosComDados, setFormulariosComDados] = useState<FormularioComDados[]>([])
  const [mostrarTodosFormularios, setMostrarTodosFormularios] = useState(false)

  const { user, empresaId } = useAuth()
  const { setLoading } = useLoading()

  // Load initial data - only depends on user and empresaId
  useEffect(() => {
    if (!user || !empresaId) return

    let isMounted = true;

    const loadInitialData = async () => {
      setIsInitialLoading(true)
      setLoading(true)

      try {
        const [funcionariosData, formulariosData] = await Promise.all([
          funcionarioService.getByEmpresaId(empresaId),
          formularioService.getByEmpresaId(empresaId)
        ])

        if (!isMounted) return;

        setFuncionarios(funcionariosData || [])
        setFormularios(formulariosData || [])

        if (formulariosData && formulariosData.length > 0) {
          setFormularioSelecionado(formulariosData[0])
        }
      } catch (error: any) {
        if (!isMounted) return;
        toast.error("Erro ao carregar dados iniciais")
        console.error(error)
      } finally {
        if (isMounted) {
          setIsInitialLoading(false)
          setLoading(false)
        }
      }
    }

    loadInitialData()

    return () => {
      isMounted = false;
    };
  }, [user, empresaId]) // Only these dependencies

  // Load form-specific data when form selection changes
  useEffect(() => {
    if (!user || !formularioSelecionado || isInitialLoading || mostrarTodosFormularios) return

    let isMounted = true;

    const loadFormularioData = async () => {
      setLoading(true)

      try {
        const [perguntasData, respostasData] = await Promise.all([
          perguntaService.getByFormularioId(formularioSelecionado.id),
          respostaService.getByFormularioId(formularioSelecionado.id)
        ])

        if (!isMounted) return;

        setPerguntas(perguntasData || [])
        setRespostas(respostasData || [])
      } catch (error: any) {
        if (!isMounted) return;
        toast.error("Erro ao carregar dados do formulário")
        console.error(error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFormularioData()

    return () => {
      isMounted = false;
    };
  }, [formularioSelecionado, user]) // Removed setLoading from dependencies

  // Load all forms data when "todos os formulários" is selected
  useEffect(() => {
    if (!user || !mostrarTodosFormularios || formularios.length === 0) return

    let isMounted = true;

    const loadTodosFormulariosData = async () => {
      setLoading(true)

      try {
        const formulariosComDadosTemp: FormularioComDados[] = []

        for (const formulario of formularios) {
          const [perguntasData, respostasData] = await Promise.all([
            perguntaService.getByFormularioId(formulario.id),
            respostaService.getByFormularioId(formulario.id)
          ])

          // Calcular média geral do formulário
          const mediaGeral = respostasData.length > 0 
            ? respostasData.reduce((sum, r) => sum + r.valor, 0) / respostasData.length 
            : 0

          formulariosComDadosTemp.push({
            formulario,
            perguntas: perguntasData || [],
            respostas: respostasData || [],
            mediaGeral,
            totalRespostas: respostasData.length
          })
        }

        if (!isMounted) return;

        setFormulariosComDados(formulariosComDadosTemp)
      } catch (error: any) {
        if (!isMounted) return;
        toast.error("Erro ao carregar dados de todos os formulários")
        console.error(error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadTodosFormulariosData()

    return () => {
      isMounted = false;
    };
  }, [mostrarTodosFormularios, formularios, user])

  // Get unique sectors for filter
  const setoresUnicos = useMemo(() => {
    return Array.from(new Set(funcionarios.map(f => f.setor))).sort();
  }, [funcionarios]);

  // Filter responses based on selected funcionario and setor
  const respostasFiltradas = useMemo(() => {
    let filtered = respostas;

    if (funcionarioSelecionado !== 'todos') {
      filtered = filtered.filter(r => r.funcionario_id === funcionarioSelecionado);
    }

    if (setorSelecionado !== 'todos') {
      const funcionariosDoSetor = funcionarios.filter(f => f.setor === setorSelecionado);
      const idsDoSetor = funcionariosDoSetor.map(f => f.id);
      filtered = filtered.filter(r => idsDoSetor.includes(r.funcionario_id));
    }

    return filtered;
  }, [respostas, funcionarioSelecionado, setorSelecionado, funcionarios]);

  // Calculate metrics when filtered data changes
  const mediasRespostas = useMemo(() => {
    if (respostasFiltradas.length === 0 || perguntas.length === 0) return [];

    return perguntas.map(pergunta => {
      const respostasPergunta = respostasFiltradas.filter(r => r.pergunta_id === pergunta.id)
      const total = respostasPergunta.reduce((sum, r) => sum + r.valor, 0)

      return {
        idPergunta: pergunta.id,
        valor: respostasPergunta.length > 0 ? total / respostasPergunta.length : 0
      }
    })
  }, [respostasFiltradas, perguntas]);

  const mediaGeral = useMemo(() => {
    if (respostasFiltradas.length === 0) return 0;

    const total = respostasFiltradas.reduce((sum, resposta) => sum + resposta.valor, 0)
    return total / respostasFiltradas.length;
  }, [respostasFiltradas]);

  const perguntasComDistribuicoes = useMemo(() => {
    if (perguntas.length === 0) return [];

    return perguntas.map(pergunta => {
      const distribuicoes: Distribuicao[] = [
        {valor: 1, quantidade: 0},
        {valor: 2, quantidade: 0},
        {valor: 3, quantidade: 0},
        {valor: 4, quantidade: 0},
        {valor: 5, quantidade: 0},
      ]

      respostasFiltradas
        .filter(r => r.pergunta_id === pergunta.id)
        .forEach(resposta => {
          if (resposta.valor >= 1 && resposta.valor <= 5) {
            distribuicoes[resposta.valor - 1].quantidade += 1
          }
        })

      return {
        idPergunta: pergunta.id,
        distribuicoes
      }
    })
  }, [respostasFiltradas, perguntas]);

  const findFormularioByName = (nome: string) => {
    return formularios?.find(f =>
      f.nome.toLowerCase().includes(nome?.toLowerCase() || '')
    ) || formularios[0]
  }

  const chartData = useMemo(() => {
    if (mostrarTodosFormularios) {
      // Dados para gráfico de todos os formulários
      return formulariosComDados.map(item => ({
        pergunta: item.formulario.nome.substring(0, 30) + (item.formulario.nome.length > 30 ? '...' : ''),
        media: item.mediaGeral,
        perguntaCompleta: item.formulario.nome,
        totalRespostas: item.totalRespostas
      }))
    } else {
      // Dados para gráfico de perguntas do formulário selecionado
      return perguntas?.map((p, index) => ({
        pergunta: p.texto.substring(0, 30) + '...',
        media: mediasRespostas[index]?.valor || 0,
        perguntaCompleta: p.texto
      })) || []
    }
  }, [perguntas, mediasRespostas, mostrarTodosFormularios, formulariosComDados])

  const distribuicaoData = useMemo(() => {
    if (perguntasComDistribuicoes.length === 0 || respostasFiltradas.length === 0) return []

    return perguntasComDistribuicoes[0]?.distribuicoes.map(d => ({
      name: `${d.valor} - ${['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'][d.valor - 1]}`,
      value: d.quantidade,
      percentage: Math.round((d.quantidade / respostasFiltradas.length) * 100)
    })) || []
  }, [perguntasComDistribuicoes, respostasFiltradas])

  const tendenciaData = useMemo(() => [
    {mes: 'Jan', satisfacao: 3.2, treinamento: 4.1},
    {mes: 'Fev', satisfacao: 3.5, treinamento: 4.2},
    {mes: 'Mar', satisfacao: 3.8, treinamento: 4.3},
  ], [])

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

  const getStatusColor = (media: number) => {
    if (media >= 4.5) return 'text-green-600'
    if (media >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getStatusLabel = (media: number) => {
    if (media >= 4.5) return 'Excelente'
    if (media >= 3.5) return 'Bom'
    if (media >= 2.5) return 'Regular'
    return 'Ruim'
  }

  // Reset filters when form changes
  useEffect(() => {
    setFuncionarioSelecionado('todos');
    setSetorSelecionado('todos');
  }, [formularioSelecionado]);

  const handleFormularioChange = (value: string) => {
    if (value === 'todos') {
      setMostrarTodosFormularios(true)
      setFormularioSelecionado(null)
    } else {
      setMostrarTodosFormularios(false)
      const formulario = findFormularioByName(value)
      setFormularioSelecionado(formulario)
    }
  }

  const handleExportReport = () => {
    if (mostrarTodosFormularios) {
      // Export para todos os formulários
      if (formulariosComDados.length === 0) {
        toast.error('Nenhum dado de formulário para exportar');
        return;
      }

      try {
        const reportData = [];

        // Cabeçalho do relatório
        reportData.push(['RELATÓRIO GERAL DE FORMULÁRIOS']);
        reportData.push(['Gerado em:', new Date().toLocaleDateString('pt-BR')]);
        reportData.push(['']); // Linha vazia

        // Resumo geral
        reportData.push(['RESUMO GERAL']);
        reportData.push(['Total de Formulários:', formulariosComDados.length]);
        const mediaGeralTodos = formulariosComDados.reduce((sum, f) => sum + f.mediaGeral, 0) / formulariosComDados.length;
        reportData.push(['Média Geral de Todos os Formulários:', mediaGeralTodos.toFixed(2)]);
        reportData.push(['']); // Linha vazia

        // Resultados por formulário
        reportData.push(['RESULTADOS POR FORMULÁRIO']);
        reportData.push(['Nome do Formulário', 'Média Geral', 'Status', 'Total de Respostas', 'Total de Perguntas']);

        formulariosComDados.forEach((item) => {
          reportData.push([
            item.formulario.nome,
            item.mediaGeral.toFixed(2),
            getStatusLabel(item.mediaGeral),
            item.totalRespostas,
            item.perguntas.length
          ]);
        });

        // Criar planilha Excel
        const worksheet = XLSX.utils.aoa_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Geral");

        // Aplicar estilos básicos (largura das colunas)
        const colWidths = [
          { wch: 50 }, // Nome do Formulário
          { wch: 15 }, // Média Geral
          { wch: 15 }, // Status
          { wch: 20 }, // Total de Respostas
          { wch: 20 }, // Total de Perguntas
        ];
        worksheet['!cols'] = colWidths;

        // Gerar nome do arquivo
        const fileName = `relatorio_geral_formularios_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download do arquivo
        XLSX.writeFile(workbook, fileName);

        toast.success('Relatório geral exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar relatório geral:', error);
        toast.error('Erro ao exportar relatório geral. Tente novamente.');
      }
    } else {
      // Export para formulário específico
      if (!formularioSelecionado || perguntas.length === 0) {
        toast.error('Selecione um formulário com dados para exportar');
        return;
      }

      try {
        // Criar dados para o relatório
        const reportData = [];

        // Cabeçalho do relatório
        reportData.push(['RELATÓRIO DE RESULTADOS - ' + formularioSelecionado.nome.toUpperCase()]);
        reportData.push(['Gerado em:', new Date().toLocaleDateString('pt-BR')]);
        reportData.push(['']); // Linha vazia

        // Resumo geral
        reportData.push(['RESUMO GERAL']);
        reportData.push(['Total de Respostas:', respostasFiltradas.length]);
        reportData.push(['Média Geral:', mediaGeral?.toFixed(2) || '0.00']);
        reportData.push(['Status:', getStatusLabel(mediaGeral || 0)]);
        reportData.push(['']); // Linha vazia

        // Filtros aplicados
        reportData.push(['FILTROS APLICADOS']);
        reportData.push(['Funcionário:', funcionarioSelecionado === 'todos' ? 'Todos' : funcionarios.find(f => f.id === funcionarioSelecionado)?.nome || 'N/A']);
        reportData.push(['Setor:', setorSelecionado === 'todos' ? 'Todos' : setorSelecionado]);
        reportData.push(['']); // Linha vazia

        // Resultados por pergunta
        reportData.push(['RESULTADOS POR PERGUNTA']);
        reportData.push(['Pergunta', 'Média', 'Status', 'Nunca (1)', 'Raramente (2)', 'Às vezes (3)', 'Frequentemente (4)', 'Sempre (5)']);

        perguntas.forEach((pergunta, index) => {
          const media = mediasRespostas[index]?.valor || 0;
          const distribuicao = perguntasComDistribuicoes[index]?.distribuicoes || [];

          reportData.push([
            pergunta.texto,
            media.toFixed(2),
            getStatusLabel(media),
            distribuicao[0]?.quantidade || 0,
            distribuicao[1]?.quantidade || 0,
            distribuicao[2]?.quantidade || 0,
            distribuicao[3]?.quantidade || 0,
            distribuicao[4]?.quantidade || 0
          ]);
        });

        reportData.push(['']); // Linha vazia

        // Respostas detalhadas por funcionário
        if (respostasFiltradas.length > 0) {
          reportData.push(['RESPOSTAS DETALHADAS POR FUNCIONÁRIO']);

          // Agrupar respostas por funcionário
          const respostasPorFuncionario = respostasFiltradas.reduce((acc, resposta) => {
            if (!acc[resposta.funcionario_id]) {
              acc[resposta.funcionario_id] = [];
            }
            acc[resposta.funcionario_id].push(resposta);
            return acc;
          }, {} as Record<string, Resposta[]>);

          // Cabeçalho da tabela de respostas detalhadas
          const headerRow = ['Funcionário', 'Cargo', 'Setor'];
          perguntas.forEach((pergunta, index) => {
            headerRow.push(`P${index + 1}`);
          });
          headerRow.push('Média Individual');
          reportData.push(headerRow);

          // Dados de cada funcionário
          Object.entries(respostasPorFuncionario).forEach(([funcionarioId, respostasFunc]) => {
            const funcionario = funcionarios.find(f => f.id === funcionarioId);
            if (!funcionario) return;

            const row = [funcionario.nome, funcionario.cargo, funcionario.setor];

            // Adicionar respostas para cada pergunta
            perguntas.forEach(pergunta => {
              const resposta = respostasFunc.find(r => r.pergunta_id === pergunta.id);
              row.push(resposta ? resposta.valor.toString() : 'N/A');
            });

            // Calcular média individual
            const mediaIndividual = respostasFunc.length > 0
              ? respostasFunc.reduce((sum, r) => sum + r.valor, 0) / respostasFunc.length
              : 0;
            row.push(mediaIndividual.toFixed(2));

            reportData.push(row);
          });
        }

        // Criar planilha Excel
        const worksheet = XLSX.utils.aoa_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório de Resultados");

        // Aplicar estilos básicos (largura das colunas)
        const colWidths = [
          { wch: 50 }, // Pergunta/Funcionário
          { wch: 15 }, // Média/Cargo
          { wch: 15 }, // Status/Setor
          { wch: 12 }, // Nunca/P1
          { wch: 12 }, // Raramente/P2
          { wch: 12 }, // Às vezes/P3
          { wch: 15 }, // Frequentemente/P4
          { wch: 12 }, // Sempre/P5
          { wch: 15 }, // Média Individual
        ];
        worksheet['!cols'] = colWidths;

        // Gerar nome do arquivo
        const fileName = `relatorio_resultados_${formularioSelecionado.nome.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Download do arquivo
        XLSX.writeFile(workbook, fileName);

        toast.success('Relatório exportado com sucesso!');
      } catch (error) {
        console.error('Erro ao exportar relatório:', error);
        toast.error('Erro ao exportar relatório. Tente novamente.');
      }
    }
  };

  if (formularios.length === 0 && !isInitialLoading) {
    return (
      <motion.div
        initial={{opacity: 0, scale: 0.9}}
        animate={{opacity: 1, scale: 1}}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="card p-8 text-center max-w-md mx-auto">
          <motion.div
            initial={{scale: 0}}
            animate={{scale: 1}}
            transition={{delay: 0.2}}
            className="w-16 h-16 bg-foreground/10 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <SearchX className="w-8 h-8 text-foreground"/>
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Nada encontrado
          </h2>
          <p className="text-gray-600">
            Não existe nenhum formulário cadastrado para a sua empresa.
          </p>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        className="flex justify-between items-start"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Dashboard de Resultados</h1>
          <p className="text-gray-600">
            Analise os resultados dos formulários com gráficos e métricas detalhadas.
          </p>
        </div>
        <div className="flex space-x-3">
          <Select
            value={mostrarTodosFormularios ? 'todos' : (formularioSelecionado?.nome || '')}
            onValueChange={handleFormularioChange}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Selecione um formulário"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Formulários</SelectItem>
              {formularios.map((formulario) => (
                <SelectItem key={formulario.id} value={formulario.nome}>
                  {formulario.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExportReport}
            disabled={mostrarTodosFormularios ? formulariosComDados.length === 0 : (!formularioSelecionado || perguntas.length === 0)}
          >
            <Download className="w-4 h-4 mr-2"/>
            Exportar Relatório
          </Button>
        </div>
      </motion.div>

      {/* Filters - Only show when not showing all forms */}
      {!mostrarTodosFormularios && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.1}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="w-5 h-5"/>
                <span>Filtros de Análise</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Funcionário</label>
                  <Select value={funcionarioSelecionado} onValueChange={setFuncionarioSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um funcionário"/>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos os Funcionários</SelectItem>
                      {funcionarios
                        .filter(f => f.status === 'ativo')
                        .map((funcionario) => (
                          <SelectItem key={funcionario.id} value={funcionario.id}>
                            {funcionario.nome} - {funcionario.cargo}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Setor</label>
                  <Select value={setorSelecionado} onValueChange={setSetorSelecionado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um setor"/>
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
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Overview Cards */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.2}}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {mostrarTodosFormularios ? 'Total de Formulários' : 'Total de Respostas'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {mostrarTodosFormularios ? formulariosComDados.length : respostasFiltradas.length}
                </p>
              </div>
              <Users className="w-8 h-8 text-brand-blue"/>
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média Geral</p>
                <div className="flex items-center space-x-2">
                  <p className={`text-2xl font-bold ${getStatusColor(
                    mostrarTodosFormularios 
                      ? (formulariosComDados.length > 0 ? formulariosComDados.reduce((sum, f) => sum + f.mediaGeral, 0) / formulariosComDados.length : 0)
                      : (mediaGeral || 0)
                  )}`}>
                    {mostrarTodosFormularios 
                      ? (formulariosComDados.length > 0 ? (formulariosComDados.reduce((sum, f) => sum + f.mediaGeral, 0) / formulariosComDados.length).toFixed(1) : '0.0')
                      : (mediaGeral?.toFixed(1) || '0.0')
                    }
                  </p>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(
                      mostrarTodosFormularios 
                        ? (formulariosComDados.length > 0 ? formulariosComDados.reduce((sum, f) => sum + f.mediaGeral, 0) / formulariosComDados.length : 0)
                        : (mediaGeral || 0)
                    )} bg-opacity-10`}
                  >
                    {getStatusLabel(
                      mostrarTodosFormularios 
                        ? (formulariosComDados.length > 0 ? formulariosComDados.reduce((sum, f) => sum + f.mediaGeral, 0) / formulariosComDados.length : 0)
                        : (mediaGeral || 0)
                    )}
                  </Badge>
                </div>
              </div>
              <Target className="w-8 h-8 text-brand-green"/>
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Maior Pontuação</p>
                <p className="text-2xl font-bold text-green-600">
                  {mostrarTodosFormularios 
                    ? (formulariosComDados.length > 0 ? Math.max(...formulariosComDados.map(f => f.mediaGeral)).toFixed(1) : '0.0')
                    : (mediasRespostas.length > 0 ? Math.max(...mediasRespostas.map(m => m.valor)).toFixed(1) : '0.0')
                  }
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600"/>
            </div>
          </CardContent>
        </Card>

        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">
                  {mostrarTodosFormularios ? 'Total de Respostas' : 'Total de Perguntas'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {mostrarTodosFormularios 
                    ? formulariosComDados.reduce((sum, f) => sum + f.totalRespostas, 0)
                    : perguntas.length
                  }
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600"/>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Bar Chart - Média por Pergunta ou por Formulário */}
      {chartData.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.4}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>
                {mostrarTodosFormularios ? 'Média por Formulário' : 'Média por Pergunta'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis
                    dataKey="pergunta"
                    tick={{fontSize: 12}}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={100}
                  />
                  <YAxis domain={[0, 5]}/>
                  <Tooltip
                    formatter={(value: any, name: any, props: any) => {
                      const item = props?.payload;
                      if (mostrarTodosFormularios) {
                        return [
                          `${Number(value).toFixed(1)}`,
                          'Média',
                          `Total de Respostas: ${item?.totalRespostas || 0}`
                        ];
                      } else {
                        return [`${Number(value).toFixed(1)}`, 'Média'];
                      }
                    }}
                    labelFormatter={(label: any, payload: any) => {
                      const item = payload?.[0]?.payload
                      return item?.perguntaCompleta || label
                    }}
                  />
                  <Bar dataKey="media" fill="#73C24F" radius={[4, 4, 0, 0]}/>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Line Chart - Tendência - Only show when not showing all forms */}
      {!mostrarTodosFormularios && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.8}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>Tendência ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <LineChart data={tendenciaData}>
                  <CartesianGrid strokeDasharray="3 3"/>
                  <XAxis dataKey="mes"/>
                  <YAxis domain={[0, 5]}/>
                  <Tooltip/>
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
      )}

      {/* Detailed Results Table */}
      {((mostrarTodosFormularios && formulariosComDados.length > 0) || (!mostrarTodosFormularios && perguntas.length > 0)) && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 1.2}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>Resultados Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      {mostrarTodosFormularios ? 'Formulário' : 'Pergunta'}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Média</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    {mostrarTodosFormularios ? (
                      <>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Total de Respostas</th>
                        <th className="text-left py-3 px-4 font-medium text-foreground">Total de Perguntas</th>
                      </>
                    ) : (
                      <th className="text-left py-3 px-4 font-medium text-foreground">Distribuição</th>
                    )}
                  </tr>
                  </thead>
                  <tbody>
                  {mostrarTodosFormularios ? (
                    formulariosComDados.map((item, index) => (
                      <motion.tr
                        key={item.formulario.id}
                        initial={{opacity: 0, y: 10}}
                        animate={{opacity: 1, y: 0}}
                        transition={{delay: 0.1 * index}}
                        className="border-b border-gray-100 hover:bg-white/30 transition-colors"
                      >
                        <td className="py-3 px-4 text-foreground max-w-xs">
                          {item.formulario.nome}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-lg font-bold ${getStatusColor(item.mediaGeral)}`}>
                            {item.mediaGeral.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="secondary"
                            className={`${getStatusColor(item.mediaGeral)} bg-opacity-10`}
                          >
                            {getStatusLabel(item.mediaGeral)}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {item.totalRespostas}
                        </td>
                        <td className="py-3 px-4 text-foreground">
                          {item.perguntas.length}
                        </td>
                      </motion.tr>
                    ))
                  ) : (
                    perguntas.map((pergunta, index) => {
                      const media = mediasRespostas[index]?.valor || 0
                      const distribuicao = perguntasComDistribuicoes[index]?.distribuicoes || []

                      return (
                        <motion.tr
                          key={pergunta.id}
                          initial={{opacity: 0, y: 10}}
                          animate={{opacity: 1, y: 0}}
                          transition={{delay: 0.1 * index}}
                          className="border-b border-gray-100 hover:bg-white/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-foreground max-w-xs">
                            {pergunta.texto}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-lg font-bold ${getStatusColor(media)}`}>
                              {media.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(media)} bg-opacity-10`}
                            >
                              {getStatusLabel(media)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex space-x-1">
                              {distribuicao.map((dist, distIndex) => (
                                <div
                                  key={distIndex}
                                  className="w-8 h-6 rounded text-xs flex items-center justify-center text-white font-medium"
                                  style={{backgroundColor: COLORS[distIndex]}}
                                >
                                  {dist.quantidade}
                                </div>
                              ))}
                            </div>
                          </td>
                        </motion.tr>
                      )
                    })
                  )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  )
}