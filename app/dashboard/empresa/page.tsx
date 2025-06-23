'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, User, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { empresaService } from '@/lib/database';
import type { Empresa } from '@/lib/supabase';

const empresaSchema = z.object({
  razaoSocial: z.string().min(1, 'Razão social é obrigatória'),
  cnpj: z.string().min(14, 'CNPJ deve ter 14 dígitos'),
  nomeFantasia: z.string().min(1, 'Nome fantasia é obrigatório'),
  telefone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  celular: z.string().min(11, 'Celular deve ter pelo menos 11 dígitos'),
  responsavelLegal: z.string().min(1, 'Nome do responsável legal é obrigatório'),
  cpfResponsavel: z.string().min(11, 'CPF deve ter 11 dígitos'),
  nomeTecnico: z.string().min(1, 'Nome do técnico é obrigatório'),
  cpfTecnico: z.string().min(11, 'CPF do técnico deve ter 11 dígitos'),
  mte: z.string().min(1, 'MTE é obrigatório'),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

export default function CadastroEmpresa() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
  });

  useEffect(() => {
    if (user) {
      loadEmpresa();
    }
  }, [user]);

  const loadEmpresa = async () => {
    if (!user) return;
    
    try {
      const empresaData = await empresaService.getByUserId(user.id);
      if (empresaData) {
        setEmpresa(empresaData);
        // Preencher formulário com dados existentes
        setValue('razaoSocial', empresaData.razao_social);
        setValue('cnpj', empresaData.cnpj);
        setValue('nomeFantasia', empresaData.nome_fantasia);
        setValue('telefone', empresaData.telefone);
        setValue('email', empresaData.email);
        setValue('celular', empresaData.celular);
        setValue('responsavelLegal', empresaData.responsavel_legal);
        setValue('cpfResponsavel', empresaData.cpf_responsavel);
        setValue('nomeTecnico', empresaData.nome_tecnico);
        setValue('cpfTecnico', empresaData.cpf_tecnico);
        setValue('mte', empresaData.mte);
      }
    } catch (error: any) {
      toast.error('Erro ao carregar dados da empresa');
    }
  };

  const onSubmit = async (data: EmpresaFormData) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const empresaData = {
        razao_social: data.razaoSocial,
        cnpj: data.cnpj.replace(/\D/g, ''),
        nome_fantasia: data.nomeFantasia,
        telefone: data.telefone.replace(/\D/g, ''),
        email: data.email,
        celular: data.celular.replace(/\D/g, ''),
        responsavel_legal: data.responsavelLegal,
        cpf_responsavel: data.cpfResponsavel.replace(/\D/g, ''),
        nome_tecnico: data.nomeTecnico,
        cpf_tecnico: data.cpfTecnico.replace(/\D/g, ''),
        mte: data.mte,
        user_id: user.id,
      };

      if (empresa) {
        // Atualizar empresa existente
        await empresaService.update(empresa.id, empresaData);
        toast.success('Empresa atualizada com sucesso!');
        setIsEditing(false);
      } else {
        // Criar nova empresa
        const novaEmpresa = await empresaService.create(empresaData);
        setEmpresa(novaEmpresa);
        toast.success('Empresa cadastrada com sucesso!');
        setIsSuccess(true);
        
        setTimeout(() => {
          setIsSuccess(false);
        }, 3000);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar empresa');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1-$2')
      .substring(0, 14);
  };

  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .substring(0, 15);
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center min-h-[60vh]"
      >
        <Card className="glass-card p-8 text-center max-w-md mx-auto">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <CheckCircle className="w-8 h-8 text-green-600" />
          </motion.div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Sucesso!
          </h2>
          <p className="text-gray-600">
            Empresa cadastrada com sucesso no sistema.
          </p>
        </Card>
      </motion.div>
    );
  }

  const isReadOnly = (empresa && !isEditing) || false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-between items-start"
      >
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {empresa ? 'Dados da Empresa' : 'Cadastro de Empresa'}
          </h1>
          <p className="text-gray-600">
            {empresa 
              ? 'Visualize e edite os dados da sua empresa'
              : 'Registre sua empresa e o técnico responsável no sistema'
            }
          </p>
        </div>
        
        {empresa && (
          <Button
            onClick={() => setIsEditing(!isEditing)}
            variant={isEditing ? "outline" : "default"}
            className={!isEditing ? "brand-gradient hover:opacity-90 transition-opacity" : ""}
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </Button>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção Empresa */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building2 className="w-5 h-5 text-brand-blue" />
                <span>Dados da Empresa</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="razaoSocial">Razão Social *</Label>
                  <Input
                    id="razaoSocial"
                    {...register('razaoSocial')}
                    placeholder="Ex: TechCorp Serviços Ltda"
                    className={errors.razaoSocial ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.razaoSocial && (
                    <p className="text-sm text-red-600">{errors.razaoSocial.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ *</Label>
                  <Input
                    id="cnpj"
                    {...register('cnpj')}
                    placeholder="00.000.000/0000-00"
                    onChange={(e) => {
                      e.target.value = formatCNPJ(e.target.value);
                      register('cnpj').onChange(e);
                    }}
                    className={errors.cnpj ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.cnpj && (
                    <p className="text-sm text-red-600">{errors.cnpj.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nomeFantasia">Nome Fantasia *</Label>
                  <Input
                    id="nomeFantasia"
                    {...register('nomeFantasia')}
                    placeholder="Ex: TechCorp"
                    className={errors.nomeFantasia ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.nomeFantasia && (
                    <p className="text-sm text-red-600">{errors.nomeFantasia.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    {...register('telefone')}
                    placeholder="(11) 3000-0000"
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                      register('telefone').onChange(e);
                    }}
                    className={errors.telefone ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.telefone && (
                    <p className="text-sm text-red-600">{errors.telefone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    {...register('email')}
                    placeholder="contato@empresa.com"
                    className={errors.email ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.email && (
                    <p className="text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="celular">Celular *</Label>
                  <Input
                    id="celular"
                    {...register('celular')}
                    placeholder="(11) 99000-0000"
                    onChange={(e) => {
                      e.target.value = formatPhone(e.target.value);
                      register('celular').onChange(e);
                    }}
                    className={errors.celular ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.celular && (
                    <p className="text-sm text-red-600">{errors.celular.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsavelLegal">Nome do Responsável Legal *</Label>
                  <Input
                    id="responsavelLegal"
                    {...register('responsavelLegal')}
                    placeholder="Ex: João Silva"
                    className={errors.responsavelLegal ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.responsavelLegal && (
                    <p className="text-sm text-red-600">{errors.responsavelLegal.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfResponsavel">CPF do Responsável *</Label>
                  <Input
                    id="cpfResponsavel"
                    {...register('cpfResponsavel')}
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      e.target.value = formatCPF(e.target.value);
                      register('cpfResponsavel').onChange(e);
                    }}
                    className={errors.cpfResponsavel ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.cpfResponsavel && (
                    <p className="text-sm text-red-600">{errors.cpfResponsavel.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seção Técnico Responsável */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5 text-brand-green" />
                <span>Técnico Responsável</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="nomeTecnico">Nome *</Label>
                  <Input
                    id="nomeTecnico"
                    {...register('nomeTecnico')}
                    placeholder="Ex: Maria Santos"
                    className={errors.nomeTecnico ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.nomeTecnico && (
                    <p className="text-sm text-red-600">{errors.nomeTecnico.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="cpfTecnico">CPF *</Label>
                  <Input
                    id="cpfTecnico"
                    {...register('cpfTecnico')}
                    placeholder="000.000.000-00"
                    onChange={(e) => {
                      e.target.value = formatCPF(e.target.value);
                      register('cpfTecnico').onChange(e);
                    }}
                    className={errors.cpfTecnico ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.cpfTecnico && (
                    <p className="text-sm text-red-600">{errors.cpfTecnico.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mte">MTE *</Label>
                  <Input
                    id="mte"
                    {...register('mte')}
                    placeholder="Ex: SP-000000"
                    className={errors.mte ? 'border-red-500' : ''}
                    readOnly={isReadOnly}
                  />
                  {errors.mte && (
                    <p className="text-sm text-red-600">{errors.mte.message}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          {(!empresa || isEditing) && (
            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="brand-gradient hover:opacity-90 transition-opacity px-8 py-2"
              >
                {isSubmitting ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                  />
                ) : null}
                {isSubmitting ? 'Salvando...' : (empresa ? 'Atualizar Empresa' : 'Cadastrar Empresa')}
              </Button>
            </div>
          )}
        </form>
      </motion.div>
    </div>
  );
}