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
import {BarChart3, Download, SearchX, Target, TrendingUp, Users, Filter, AlertTriangle} from 'lucide-react';
import {toast} from "sonner";
import {useAuth} from "@/contexts/AuthContext";
import {useLoading} from "@/contexts/LoadingContext";
import {Formulario, Funcionario, Pergunta, Resposta} from "@/lib/supabase";
import {funcionarioService} from "@/services/funcionario";
import {respostaService} from "@/services/resposta";
import {formularioService} from "@/services/formulario";
import {perguntaService} from "@/services/pergunta";
import * as XLSX from 'xlsx';

interface Distribuicao {
  valor: number;
  quantidade: number;
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
    if (!user || !formularioSelecionado || isInitialLoading) return

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

  // Load all forms data when "todos" is selected
  useEffect(() => {
    if (!user || formularioSelecionado !== null || isInitialLoading) return

    let isMounted = true;

    const loadAllFormsData = async () => {
      setLoading(true)

      try {
        // Load all responses from all forms
        const allRespostas: Resposta[] = []
        const allPerguntas: Pergunta[] = []

        for (const formulario of formularios) {
          const [perguntasData, respostasData] = await Promise.all([
            perguntaService.getByFormularioId(formulario.id),
            respostaService.getByFormularioId(formulario.id)
          ])

          allPerguntas.push(...perguntasData)
          allRespostas.push(...respostasData)
        }

        if (!isMounted) return;

        setPerguntas(allPerguntas)
        setRespostas(allRespostas)
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

    loadAllFormsData()

    return () => {
      isMounted = false;
    };
  }, [formularioSelecionado, formularios, user]) // Removed setLoading from dependencies

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
    if (formularioSelecionado === null) {
      // When showing all forms, group by form
      const formMedias: { [key: string]: { nome: string; media: number } } = {}
      
      formularios.forEach(formulario => {
        const respostasForm = respostasFiltradas.filter(r => r.formulario_id === formulario.id)
        if (respostasForm.length > 0) {
          const total = respostasForm.reduce((sum, r) => sum + r.valor, 0)
          formMedias[formulario.id] = {
            nome: formulario.nome,
            media: total / respostasForm.length
          }
        }
      })
      
      return Object.entries(formMedias).map(([id, data]) => ({
        idPergunta: id,
        valor: data.media
      }))
    } else {
      // When showing specific form, group by question
      if (respostasFiltradas.length === 0 || perguntas.length === 0) return [];

      return perguntas.map(pergunta => {
        const respostasPergunta = respostasFiltradas.filter(r => r.pergunta_id === pergunta.id)
        const total = respostasPergunta.reduce((sum, r) => sum + r.valor, 0)

        return {
          idPergunta: pergunta.id,
          valor: respostasPergunta.length > 0 ? total / respostasPergunta.length : 0
        }
      })
    }
  }, [respostasFiltradas, perguntas, formularios, formularioSelecionado]);

  const mediaGeral = useMemo(() => {
    if (respostasFiltradas.length === 0) return 0;

    const total = respostasFiltradas.reduce((sum, resposta) => sum + resposta.valor, 0)
    return total / respostasFiltradas.length;
  }, [respostasFiltradas]);

  // Calculate risk classification based on sum of responses
  const classificacaoRisco = useMemo(() => {
    if (respostasFiltradas.length === 0) return { nivel: 'N/A', cor: 'gray', soma: 0 };

    const somaTotal = respostasFiltradas.reduce((sum, resposta) => sum + resposta.valor, 0);

    if (somaTotal >= 1 && somaTotal <= 3) {
      return { nivel: 'Trivial', cor: 'green', soma: somaTotal };
    } else if (somaTotal >= 4 && somaTotal <= 8) {
      return { nivel: 'Tolerável', cor: 'blue', soma: somaTotal };
    } else if (somaTotal >= 9 && somaTotal <= 12) {
      return { nivel: 'Moderado', cor: 'yellow', soma: somaTotal };
    } else if (somaTotal >= 13 && somaTotal <= 19) {
      return { nivel: 'Alto', cor: 'orange', soma: somaTotal };
    } else if (somaTotal >= 20 && somaTotal <= 25) {
      return { nivel: 'Extremo', cor: 'red', soma: somaTotal };
    } else {
      // For values above 25, still classify as Extremo
      return { nivel: 'Extremo', cor: 'red', soma: somaTotal };
    }
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
    if (formularioSelecionado === null) {
      // Show data by forms
      return formularios?.map((f) => {
        const media = mediasRespostas.find(m => m.idPergunta === f.id)?.valor || 0
        return {
          pergunta: f.nome.substring(0, 30) + (f.nome.length > 30 ? '...' : ''),
          media: media,
          perguntaCompleta: f.nome
        }
      }).filter(item => item.media > 0) || []
    } else {
      // Show data by questions
      return perguntas?.map((p, index) => ({
        pergunta: p.texto.substring(0, 30) + '...',
        media: mediasRespostas[index]?.valor || 0,
        perguntaCompleta: p.texto
      })) || []
    }
  }, [perguntas, mediasRespostas, formularios, formularioSelecionado])

  const distribuicaoData = useMemo(() => {
    if (perguntasComDistribuicoes.length === 0 || respostasFiltradas.length === 0) return []

    return perguntasComDistribuicoes[0]?.distribuicoes.map(d => ({
      name: `${d.valor} - ${['Nunca', 'Raramente', 'Às vezes', 'Frequentemente', 'Sempre'][d.valor - 1]}`,
      value: d.quantidade,
      percentage: Math.round((d.quantidade / respostasFiltradas.length) * 100)
    })) || []
  }, [perguntasComDistribuicoes, respostasFiltradas])

  // Calculate real trend data based on responses over time
  const tendenciaData = useMemo(() => {
    if (respostasFiltradas.length === 0) {
      return [];
    }

    // Group responses by month
    const respostasPorMes: { [key: string]: Resposta[] } = {};
    
    respostasFiltradas.forEach(resposta => {
      const data = new Date(resposta.created_at);
      const mesAno = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`;
      
      if (!respostasPorMes[mesAno]) {
        respostasPorMes[mesAno] = [];
      }
      respostasPorMes[mesAno].push(resposta);
    });

    // Convert to chart data
    const meses = Object.keys(respostasPorMes).sort();
    
    return meses.map(mesAno => {
      const respostasDoMes = respostasPorMes[mesAno];
      const mediaDoMes = respostasDoMes.reduce((sum, r) => sum + r.valor, 0) / respostasDoMes.length;
      
      // Format month name
      const [ano, mes] = mesAno.split('-');
      const nomesMeses = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const nomeDoMes = nomesMeses[parseInt(mes) - 1];
      
      return {
        mes: `${nomeDoMes}/${ano.slice(-2)}`,
        media: Number(mediaDoMes.toFixed(2)),
        totalRespostas: respostasDoMes.length
      };
    });
  }, [respostasFiltradas]);

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#10b981']

  const getStatusColor = (media: number) => {
    if (media >= 4.5) return 'text-red-600 bg-red-100'
    if (media >= 3.5) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getStatusLabel = (media: number) => {
    if (media >= 4.5) return 'Ruim'
    if (media >= 3.5) return 'Regular'
    if (media >= 2.5) return 'Bom'
    return 'Excelente'
  }

  const getRiskColor = (cor: string) => {
    switch (cor) {
      case 'green': return 'text-green-600 bg-green-100'
      case 'blue': return 'text-blue-600 bg-blue-100'
      case 'yellow': return 'text-yellow-600 bg-yellow-100'
      case 'orange': return 'text-orange-600 bg-orange-100'
      case 'red': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  // Reset filters when form changes
  useEffect(() => {
    setFuncionarioSelecionado('todos');
    setSetorSelecionado('todos');
  }, [formularioSelecionado]);

  const handleExportReport = () => {
    if (formularios.length === 0) {
      toast.error('Nenhum dado disponível para exportar');
      return;
    }

    try {
      // Criar dados para o relatório
      const reportData = [];

      // Cabeçalho do relatório
      const tituloRelatorio = formularioSelecionado 
        ? `RELATÓRIO DE RESULTADOS - ${formularioSelecionado.nome.toUpperCase()}`
        : 'RELATÓRIO DE RESULTADOS - TODOS OS FORMULÁRIOS';
      
      reportData.push([tituloRelatorio]);
      reportData.push(['Gerado em:', new Date().toLocaleDateString('pt-BR')]);
      reportData.push(['']); // Linha vazia

      // Resumo geral
      reportData.push(['RESUMO GERAL']);
      reportData.push(['Total de Respostas:', respostasFiltradas.length]);
      reportData.push(['Média Geral:', mediaGeral?.toFixed(2) || '0.00']);
      reportData.push(['Status:', getStatusLabel(mediaGeral || 0)]);
      // reportData.push(['Matriz de Risco:', classificacaoRisco.nivel]);
      reportData.push(['Soma Total das Respostas:', classificacaoRisco.soma]);
      reportData.push(['']); // Linha vazia

      // Filtros aplicados
      reportData.push(['FILTROS APLICADOS']);
      reportData.push(['Formulário:', formularioSelecionado ? formularioSelecionado.nome : 'Todos os Formulários']);
      reportData.push(['Funcionário:', funcionarioSelecionado === 'todos' ? 'Todos' : funcionarios.find(f => f.id === funcionarioSelecionado)?.nome || 'N/A']);
      reportData.push(['Setor:', setorSelecionado === 'todos' ? 'Todos' : setorSelecionado]);
      reportData.push(['']); // Linha vazia

      // Tendência ao longo do tempo
      if (tendenciaData.length > 0) {
        reportData.push(['TENDÊNCIA AO LONGO DO TEMPO']);
        reportData.push(['Mês/Ano', 'Média', 'Total de Respostas']);
        tendenciaData.forEach(item => {
          reportData.push([item.mes, item.media, item.totalRespostas]);
        });
        reportData.push(['']); // Linha vazia
      }

      if (formularioSelecionado === null) {
        // Resultados por formulário
        reportData.push(['RESULTADOS POR FORMULÁRIO']);
        reportData.push(['Formulário', 'Média', 'Status', 'Total de Respostas']);

        formularios.forEach(formulario => {
          const respostasForm = respostasFiltradas.filter(r => r.formulario_id === formulario.id);
          const media = respostasForm.length > 0 
            ? respostasForm.reduce((sum, r) => sum + r.valor, 0) / respostasForm.length 
            : 0;

          reportData.push([
            formulario.nome,
            media.toFixed(2),
            getStatusLabel(media),
            respostasForm.length
          ]);
        });
      } else {
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
      }

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
        if (formularioSelecionado) {
          perguntas.forEach((pergunta, index) => {
            headerRow.push(`P${index + 1}`);
          });
        } else {
          headerRow.push('Formulários Respondidos');
        }
        headerRow.push('Média Individual');
        reportData.push(headerRow);

        // Dados de cada funcionário
        Object.entries(respostasPorFuncionario).forEach(([funcionarioId, respostasFunc]) => {
          const funcionario = funcionarios.find(f => f.id === funcionarioId);
          if (!funcionario) return;

          const row = [funcionario.nome, funcionario.cargo, funcionario.setor];

          if (formularioSelecionado) {
            // Adicionar respostas para cada pergunta
            perguntas.forEach(pergunta => {
              const resposta = respostasFunc.find(r => r.pergunta_id === pergunta.id);
              row.push(resposta ? resposta.valor.toString() : 'N/A');
            });
          } else {
            // Adicionar formulários respondidos
            const formulariosRespondidos = Array.from(new Set(respostasFunc.map(r => r.formulario_id))).length;
            row.push(formulariosRespondidos.toString());
          }

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
      const nomeArquivo = formularioSelecionado 
        ? formularioSelecionado.nome.replace(/[^a-zA-Z0-9]/g, '_')
        : 'todos_formularios';
      const fileName = `relatorio_resultados_${nomeArquivo}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Download do arquivo
      XLSX.writeFile(workbook, fileName);

      toast.success('Relatório exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório. Tente novamente.');
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
            value={formularioSelecionado?.nome || 'todos'}
            onValueChange={(value) => {
              if (value === 'todos') {
                setFormularioSelecionado(null)
              } else {
                const formulario = findFormularioByName(value)
                setFormularioSelecionado(formulario)
              }
            }}
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
            disabled={formularios.length === 0}
          >
            <Download className="w-4 h-4 mr-2"/>
            Exportar Relatório
          </Button>
        </div>
      </motion.div>

      {/* Filters */}
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

      {/* Overview Cards */}
      <motion.div
        initial={{opacity: 0, y: 20}}
        animate={{opacity: 1, y: 0}}
        transition={{delay: 0.2}}
        className="grid grid-cols-1 md:grid-cols-5 gap-6"
      >
        <Card className="card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Respostas</p>
                <p className="text-2xl font-bold text-foreground">{respostasFiltradas.length}</p>
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
                  <p className={`text-2xl font-bold ${getStatusColor(mediaGeral || 0)} bg-transparent`}>
                    {mediaGeral?.toFixed(1) || '0.0'}
                  </p>
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(mediaGeral || 0)}`}
                  >
                    {getStatusLabel(mediaGeral || 0)}
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
                <p className="text-2xl font-bold text-red-600">
                  {mediasRespostas.length > 0 ? Math.max(...mediasRespostas.map(m => m.valor)).toFixed(1) : '0.0'}
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
                  {formularioSelecionado ? 'Total de Perguntas' : 'Total de Formulários'}
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {formularioSelecionado ? perguntas.length : formularios.length}
                </p>
              </div>
              <BarChart3 className="w-8 h-8 text-purple-600"/>
            </div>
          </CardContent>
        </Card>

        {/*<Card className="card">*/}
        {/*  <CardContent className="p-6">*/}
        {/*    <div className="flex items-center justify-between">*/}
        {/*      <div>*/}
        {/*        <p className="text-sm text-gray-600">Matriz de Risco</p>*/}
        {/*        <div className="flex items-center space-x-2">*/}
        {/*          <p className="text-lg font-bold text-foreground">{classificacaoRisco.soma}</p>*/}
        {/*          <Badge*/}
        {/*            variant="secondary"*/}
        {/*            className={`${getRiskColor(classificacaoRisco.cor)}`}*/}
        {/*          >*/}
        {/*            {classificacaoRisco.nivel}*/}
        {/*          </Badge>*/}
        {/*        </div>*/}
        {/*      </div>*/}
        {/*      <AlertTriangle className="w-8 h-8 text-orange-600"/>*/}
        {/*    </div>*/}
        {/*  </CardContent>*/}
        {/*</Card>*/}
      </motion.div>

      {/* Bar Chart - Média por Pergunta/Formulário */}
      {chartData.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.4}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>
                {formularioSelecionado ? 'Média por Pergunta' : 'Média por Formulário'}
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
                    formatter={(value: any) => [`${Number(value).toFixed(1)}`, 'Média']}
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

      {/* Line Chart - Tendência Real */}
      {/*{tendenciaData.length > 0 && (*/}
      {/*  <motion.div*/}
      {/*    initial={{opacity: 0, y: 20}}*/}
      {/*    animate={{opacity: 1, y: 0}}*/}
      {/*    transition={{delay: 0.6}}*/}
      {/*  >*/}
      {/*    <Card className="card">*/}
      {/*      <CardHeader>*/}
      {/*        <CardTitle>Tendência ao Longo do Tempo</CardTitle>*/}
      {/*        <p className="text-sm text-gray-600">*/}
      {/*          Evolução da média das respostas por mês*/}
      {/*        </p>*/}
      {/*      </CardHeader>*/}
      {/*      <CardContent>*/}
      {/*        <ResponsiveContainer width="100%" height={400}>*/}
      {/*          <LineChart data={tendenciaData}>*/}
      {/*            <CartesianGrid strokeDasharray="3 3"/>*/}
      {/*            <XAxis dataKey="mes"/>*/}
      {/*            <YAxis domain={[0, 5]}/>*/}
      {/*            <Tooltip*/}
      {/*              formatter={(value: any, name: string) => [*/}
      {/*                name === 'media' ? `${Number(value).toFixed(2)}` : value,*/}
      {/*                name === 'media' ? 'Média' : 'Total de Respostas'*/}
      {/*              ]}*/}
      {/*              labelFormatter={(label) => `Período: ${label}`}*/}
      {/*            />*/}
      {/*            <Line*/}
      {/*              type="monotone"*/}
      {/*              dataKey="media"*/}
      {/*              stroke="#73C24F"*/}
      {/*              strokeWidth={3}*/}
      {/*              name="Média"*/}
      {/*              dot={{ fill: '#73C24F', strokeWidth: 2, r: 6 }}*/}
      {/*              activeDot={{ r: 8, stroke: '#73C24F', strokeWidth: 2 }}*/}
      {/*            />*/}
      {/*          </LineChart>*/}
      {/*        </ResponsiveContainer>*/}
      {/*      </CardContent>*/}
      {/*    </Card>*/}
      {/*  </motion.div>*/}
      {/*)}*/}

      {/* Show message when no trend data */}
      {tendenciaData.length === 0 && respostasFiltradas.length > 0 && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.6}}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle>Tendência ao Longo do Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4"/>
                <p className="text-gray-600">
                  Dados insuficientes para mostrar tendência ao longo do tempo
                </p>
                <p className="text-sm text-gray-500">
                  É necessário ter respostas em diferentes meses para visualizar a evolução
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Detailed Results Table */}
      {(formularioSelecionado ? perguntas.length > 0 : formularios.length > 0) && (
        <motion.div
          initial={{opacity: 0, y: 20}}
          animate={{opacity: 1, y: 0}}
          transition={{delay: 0.8}}
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
                      {formularioSelecionado ? 'Pergunta' : 'Formulário'}
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Média</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">
                      {formularioSelecionado ? 'Distribuição' : 'Total de Respostas'}
                    </th>
                  </tr>
                  </thead>
                  <tbody>
                  {formularioSelecionado ? (
                    // Show questions when specific form is selected
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
                            <span className={`text-lg font-bold ${getStatusColor(media)} bg-transparent`}>
                              {media.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(media)}`}
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
                  ) : (
                    // Show forms when "todos" is selected
                    formularios.map((formulario, index) => {
                      const respostasForm = respostasFiltradas.filter(r => r.formulario_id === formulario.id)
                      const media = respostasForm.length > 0 
                        ? respostasForm.reduce((sum, r) => sum + r.valor, 0) / respostasForm.length 
                        : 0

                      return (
                        <motion.tr
                          key={formulario.id}
                          initial={{opacity: 0, y: 10}}
                          animate={{opacity: 1, y: 0}}
                          transition={{delay: 0.1 * index}}
                          className="border-b border-gray-100 hover:bg-white/30 transition-colors"
                        >
                          <td className="py-3 px-4 text-foreground max-w-xs">
                            {formulario.nome}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`text-lg font-bold ${getStatusColor(media)}`}>
                              {media.toFixed(1)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge
                              variant="secondary"
                              className={`${getStatusColor(media)}`}
                            >
                              {getStatusLabel(media)}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-lg font-bold text-foreground">
                              {respostasForm.length}
                            </span>
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