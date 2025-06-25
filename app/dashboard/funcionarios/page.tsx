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
  Edit,
  FileCheck,
  X
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLoading } from '@/contexts/LoadingContext';
import { funcionarioService } from '@/services/funcionario';
import type { Funcionario } from '@/lib/supabase';
import * as XLSX from 'xlsx';

interface ParsedEmployee {
  nome: string;
  cargo: string;
  setor: string;
  cpf: string;
  email: string;
  valid: boolean;
  errors: string[];
}

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
  const [parsedEmployees, setParsedEmployees] = useState<ParsedEmployee[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user, empresaId } = useAuth();
  const { setLoading } = useLoading();

  // Load funcionarios - only depends on user and empresaId
  useEffect(() => {
    if (!user || !empresaId) return;

    let isMounted = true;

    const loadFuncionarios = async () => {
      setLoading(true);
      try {
        console.log('Loading funcionarios for empresa:', empresaId);
        const funcionariosData = await funcionarioService.getByEmpresaId(empresaId);
        
        if (isMounted) {
          console.log('Funcionarios loaded successfully:', funcionariosData.length);
          setFuncionarios(funcionariosData);
        }
      } catch (error: any) {
        if (isMounted) {
          console.error('Error loading funcionarios:', error);
          toast.error('Erro ao carregar funcionários');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadFuncionarios();

    return () => {
      isMounted = false;
    };
  }, [user, empresaId]); // Only these dependencies

  const validateEmployee = (employee: any): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!employee.nome || employee.nome.trim().length < 2) {
      errors.push('Nome deve ter pelo menos 2 caracteres');
    }

    if (!employee.cargo || employee.cargo.trim().length < 2) {
      errors.push('Cargo deve ter pelo menos 2 caracteres');
    }

    if (!employee.setor || employee.setor.trim().length < 2) {
      errors.push('Setor deve ter pelo menos 2 caracteres');
    }

    if (!employee.cpf || employee.cpf.toString().replace(/\D/g, '').length !== 11) {
      errors.push('CPF deve ter 11 dígitos');
    }

    if (!employee.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(employee.email)) {
      errors.push('Email inválido');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  };

  const parseCSVFile = (text: string): ParsedEmployee[] => {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
    }

    // Parse CSV (handling both comma and semicolon separators)
    const separator = text.includes(';') ? ';' : ',';
    const headers = lines[0].split(separator).map(h => h.trim().replace(/"/g, ''));
    const employees: ParsedEmployee[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(separator).map(v => v.trim().replace(/"/g, ''));
      
      if (values.length >= 5 && values.some(v => v.trim())) {
        const employee = {
          nome: values[0] || '',
          cargo: values[1] || '',
          setor: values[2] || '',
          cpf: values[3] || '',
          email: values[4] || ''
        };

        const validation = validateEmployee(employee);
        
        employees.push({
          ...employee,
          valid: validation.valid,
          errors: validation.errors
        });
      }
    }

    return employees;
  };

  const parseExcelFile = (file: File): Promise<ParsedEmployee[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Get the first worksheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length < 2) {
            throw new Error('Arquivo deve conter pelo menos um cabeçalho e uma linha de dados');
          }

          const employees: ParsedEmployee[] = [];
          
          // Skip header row (index 0)
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i] as any[];
            
            if (row && row.length >= 5 && row.some(cell => cell && cell.toString().trim())) {
              const employee = {
                nome: row[0] ? row[0].toString().trim() : '',
                cargo: row[1] ? row[1].toString().trim() : '',
                setor: row[2] ? row[2].toString().trim() : '',
                cpf: row[3] ? row[3].toString().trim() : '',
                email: row[4] ? row[4].toString().trim() : ''
              };

              const validation = validateEmployee(employee);
              
              employees.push({
                ...employee,
                valid: validation.valid,
                errors: validation.errors
              });
            }
          }

          resolve(employees);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler o arquivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!empresaId) {
      toast.error('Empresa não identificada');
      return;
    }

    setIsUploading(true);
    setParsedEmployees([]);
    setShowPreview(false);

    try {
      let employees: ParsedEmployee[] = [];
      
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'csv') {
        // Handle CSV files
        const text = await file.text();
        employees = parseCSVFile(text);
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        employees = await parseExcelFile(file);
      } else {
        throw new Error('Formato de arquivo não suportado. Use CSV, XLSX ou XLS.');
      }

      if (employees.length === 0) {
        toast.error('Nenhum funcionário válido encontrado no arquivo');
        return;
      }

      setParsedEmployees(employees);
      setShowPreview(true);
      
      const validCount = employees.filter(e => e.valid).length;
      const invalidCount = employees.length - validCount;

      if (invalidCount > 0) {
        toast.warning(`${validCount} funcionários válidos, ${invalidCount} com erros encontrados. Revise os dados antes de processar.`);
      } else {
        toast.success(`${validCount} funcionários válidos encontrados. Clique em "Processar Planilha" para importar.`);
      }

    } catch (error: any) {
      toast.error('Erro ao processar arquivo: ' + (error.message || 'Erro desconhecido'));
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleProcessSpreadsheet = async () => {
    if (!empresaId) {
      toast.error('Empresa não identificada');
      return;
    }

    const validEmployees = parsedEmployees.filter(e => e.valid);
    
    if (validEmployees.length === 0) {
      toast.error('Nenhum funcionário válido para processar');
      return;
    }

    setIsProcessing(true);

    try {
      const funcionariosData = validEmployees.map(employee => ({
        empresa_id: empresaId,
        nome: employee.nome.trim(),
        cargo: employee.cargo.trim(),
        setor: employee.setor.trim(),
        cpf: employee.cpf.replace(/\D/g, ''),
        email: employee.email.trim(),
        status: 'ativo' as const
      }));

      // Save to database
      await funcionarioService.createMany(funcionariosData);
      
      // Reload data
      const updatedFuncionarios = await funcionarioService.getByEmpresaId(empresaId);
      setFuncionarios(updatedFuncionarios);
      
      // Clear preview and reset form
      setParsedEmployees([]);
      setShowPreview(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setUploadSuccess(true);
      toast.success(`${validEmployees.length} funcionários importados com sucesso!`);

      // Hide success message after 3 seconds
      setTimeout(() => setUploadSuccess(false), 3000);

    } catch (error: any) {
      toast.error('Erro ao importar funcionários: ' + (error.message || 'Erro desconhecido'));
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setParsedEmployees([]);
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDownloadTemplate = () => {
    const data = [
      ["Nome", "Cargo", "Setor", "CPF", "Email"],
      ["João Silva", "Analista", "TI", "123.456.789-00", "joao@empresa.com"],
      ["Maria Santos", "Gerente", "RH", "987.654.321-00", "maria@empresa.com"],
      ["Pedro Costa", "Desenvolvedor", "TI", "111.222.333-44", "pedro@empresa.com"]
    ];

    // Create Excel file
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Funcionários");
    
    // Download as Excel file
    XLSX.writeFile(workbook, 'template_funcionarios.xlsx');

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

      // Reload data
      const updatedFuncionarios = await funcionarioService.getByEmpresaId(empresaId);
      setFuncionarios(updatedFuncionarios);
      
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
            Importe dados de funcionários via planilhas de forma simples.
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
                      disabled={isUploading || isProcessing}
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
                    <span>Analisando planilha...</span>
                  </motion.div>
                )}

                {showPreview && (
                  <div className="flex space-x-3">
                    <Button
                      onClick={handleProcessSpreadsheet}
                      disabled={isProcessing || parsedEmployees.filter(e => e.valid).length === 0}
                      className="brand-gradient hover:opacity-90 transition-opacity flex-1"
                    >
                      {isProcessing ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                        />
                      ) : (
                        <FileCheck className="w-4 h-4 mr-2" />
                      )}
                      {isProcessing ? 'Processando...' : `Processar Planilha (${parsedEmployees.filter(e => e.valid).length})`}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleCancelPreview}
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800">
                      <p className="font-medium mb-1">Formato da Planilha:</p>
                      <ul className="space-y-1 text-xs">
                        <li>• <strong>Coluna A:</strong> Nome completo do funcionário</li>
                        <li>• <strong>Coluna B:</strong> Cargo ou função</li>
                        <li>• <strong>Coluna C:</strong> Setor do funcionário</li>
                        <li>• <strong>Coluna D:</strong> CPF (com ou sem pontuação)</li>
                        <li>• <strong>Coluna E:</strong> Email corporativo</li>
                        <li className="mt-2 text-blue-700">• A primeira linha deve conter os cabeçalhos</li>
                        <li>• Suporta formatos: CSV, XLSX, XLS</li>
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
                  Baixar Template (Excel)
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Preview Section */}
      {showPreview && parsedEmployees.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileCheck className="w-5 h-5 text-brand-green" />
                <span>Prévia da Planilha</span>
                <Badge variant="secondary">
                  {parsedEmployees.filter(e => e.valid).length} válidos / {parsedEmployees.length} total
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 px-3 font-medium">Status</th>
                      <th className="text-left py-2 px-3 font-medium">Nome</th>
                      <th className="text-left py-2 px-3 font-medium">Cargo</th>
                      <th className="text-left py-2 px-3 font-medium">Setor</th>
                      <th className="text-left py-2 px-3 font-medium">CPF</th>
                      <th className="text-left py-2 px-3 font-medium">Email</th>
                      <th className="text-left py-2 px-3 font-medium">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedEmployees.map((employee, index) => (
                      <tr key={index} className={`border-b border-gray-100 ${employee.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                        <td className="py-2 px-3">
                          {employee.valid ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-red-600" />
                          )}
                        </td>
                        <td className="py-2 px-3">{employee.nome}</td>
                        <td className="py-2 px-3">{employee.cargo}</td>
                        <td className="py-2 px-3">{employee.setor}</td>
                        <td className="py-2 px-3">{employee.cpf}</td>
                        <td className="py-2 px-3">{employee.email}</td>
                        <td className="py-2 px-3">
                          {employee.errors.length > 0 && (
                            <div className="text-xs text-red-600">
                              {employee.errors.join(', ')}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

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