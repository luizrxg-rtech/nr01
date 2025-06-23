'use client';

import { useState, useRef } from 'react';
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
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

interface Funcionario {
  id: number;
  nome: string;
  cargo: string;
  cpf: string;
  email: string;
  status: 'ativo' | 'inativo';
}

export default function GerenciarFuncionarios() {
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    // Simulate file processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock data that would come from the spreadsheet
    const newFuncionarios: Funcionario[] = [
      {
        id: funcionarios.length + 1,
        nome: 'Ana Oliveira',
        cargo: 'Designer UX',
        cpf: '321.654.987-00',
        email: 'ana.oliveira@empresa.com',
        status: 'ativo'
      },
      {
        id: funcionarios.length + 2,
        nome: 'Carlos Pereira',
        cargo: 'Analista de Dados',
        cpf: '654.321.789-00',
        email: 'carlos.pereira@empresa.com',
        status: 'ativo'
      },
      {
        id: funcionarios.length + 3,
        nome: 'Luciana Lima',
        cargo: 'Product Manager',
        cpf: '789.123.456-00',
        email: 'luciana.lima@empresa.com',
        status: 'ativo'
      }
    ];

    setFuncionarios(prev => [...prev, ...newFuncionarios]);
    setIsUploading(false);
    setUploadSuccess(true);
    toast.success(`${newFuncionarios.length} funcionários importados com sucesso!`);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Hide success message after 3 seconds
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const csvContent = "Nome,Cargo,CPF,Email\n" +
      "João Silva,Analista,123.456.789-00,joao@empresa.com\n" +
      "Maria Santos,Gerente,987.654.321-00,maria@empresa.com";
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template_funcionarios.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Template baixado com sucesso!');
  };

  const handleDeleteFuncionario = (id: number) => {
    setFuncionarios(prev => prev.filter(f => f.id !== id));
    toast.success('Funcionário removido com sucesso!');
  };

  const handleToggleStatus = (id: number) => {
    setFuncionarios(prev => prev.map(f => 
      f.id === id 
        ? { ...f, status: f.status === 'ativo' ? 'inativo' : 'ativo' }
        : f
    ));
    toast.success('Status do funcionário atualizado!');
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Funcionários</h1>
        <p className="text-gray-600">
          Importe dados de funcionários via planilha ou gerencie individualmente.
        </p>
      </motion.div>

      {/* Upload Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="glass-card">
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
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Funcionários</p>
                <p className="text-2xl font-bold text-foreground">{funcionarios.length}</p>
              </div>
              <Users className="w-8 h-8 text-brand-blue" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-green-600">
                  {funcionarios.filter(f => f.status === 'ativo').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inativos</p>
                <p className="text-2xl font-bold text-red-600">
                  {funcionarios.filter(f => f.status === 'inativo').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Funcionários List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileSpreadsheet className="w-5 h-5 text-brand-green" />
              <span>Lista de Funcionários</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-foreground">Nome</th>
                    <th className="text-left py-3 px-4 font-medium text-foreground">Cargo</th>
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
                        {funcionario.cpf}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {funcionario.email}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleStatus(funcionario.id)}
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
                            className="text-brand-blue hover:text-brand-blue-dark"
                          >
                            <Eye className="w-4 h-4" />
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}