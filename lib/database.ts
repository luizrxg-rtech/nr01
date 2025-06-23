import { supabase } from './supabase';
import type { Database, Empresa, Funcionario, Formulario, Pergunta, Resposta } from './supabase';

// Serviços para Empresas
export const empresaService = {
  async create(empresa: Database['public']['Tables']['empresas']['Insert']) {
    const { data, error } = await supabase
      .from('empresas')
      .insert(empresa)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByUserId(userId: string): Promise<Empresa | null> {
    const { data, error } = await supabase
      .from('empresas')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['empresas']['Update']) {
    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
};

// Serviços para Funcionários
export const funcionarioService = {
  async create(funcionario: Database['public']['Tables']['funcionarios']['Insert']) {
    const { data, error } = await supabase
      .from('funcionarios')
      .insert(funcionario)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createMany(funcionarios: Database['public']['Tables']['funcionarios']['Insert'][]) {
    const { data, error } = await supabase
      .from('funcionarios')
      .insert(funcionarios)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getByEmpresaId(empresaId: string): Promise<Funcionario[]> {
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome');
    
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Database['public']['Tables']['funcionarios']['Update']) {
    const { data, error } = await supabase
      .from('funcionarios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Serviços para Formulários
export const formularioService = {
  async create(formulario: Database['public']['Tables']['formularios']['Insert']) {
    const { data, error } = await supabase
      .from('formularios')
      .insert(formulario)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async getByEmpresaId(empresaId: string): Promise<Formulario[]> {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Formulario | null> {
    const { data, error } = await supabase
      .from('formularios')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async update(id: string, updates: Database['public']['Tables']['formularios']['Update']) {
    const { data, error } = await supabase
      .from('formularios')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('formularios')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },
};

// Serviços para Perguntas
export const perguntaService = {
  async create(pergunta: Database['public']['Tables']['perguntas']['Insert']) {
    const { data, error } = await supabase
      .from('perguntas')
      .insert(pergunta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createMany(perguntas: Database['public']['Tables']['perguntas']['Insert'][]) {
    const { data, error } = await supabase
      .from('perguntas')
      .insert(perguntas)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getByFormularioId(formularioId: string): Promise<Pergunta[]> {
    const { data, error } = await supabase
      .from('perguntas')
      .select('*')
      .eq('formulario_id', formularioId)
      .order('ordem');
    
    if (error) throw error;
    return data || [];
  },

  async update(id: string, updates: Database['public']['Tables']['perguntas']['Update']) {
    const { data, error } = await supabase
      .from('perguntas')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async deleteByFormularioId(formularioId: string) {
    const { error } = await supabase
      .from('perguntas')
      .delete()
      .eq('formulario_id', formularioId);
    
    if (error) throw error;
  },
};

// Serviços para Respostas
export const respostaService = {
  async create(resposta: Database['public']['Tables']['respostas']['Insert']) {
    const { data, error } = await supabase
      .from('respostas')
      .insert(resposta)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async createMany(respostas: Database['public']['Tables']['respostas']['Insert'][]) {
    const { data, error } = await supabase
      .from('respostas')
      .insert(respostas)
      .select();
    
    if (error) throw error;
    return data;
  },

  async getByFormularioId(formularioId: string): Promise<Resposta[]> {
    const { data, error } = await supabase
      .from('respostas')
      .select('*')
      .eq('formulario_id', formularioId);
    
    if (error) throw error;
    return data || [];
  },

  async getByFuncionarioAndFormulario(funcionarioId: string, formularioId: string): Promise<Resposta[]> {
    const { data, error } = await supabase
      .from('respostas')
      .select('*')
      .eq('funcionario_id', funcionarioId)
      .eq('formulario_id', formularioId);
    
    if (error) throw error;
    return data || [];
  },

  async getFormularioStats(formularioId: string) {
    // Buscar respostas com dados dos funcionários
    const { data: respostas, error } = await supabase
      .from('respostas')
      .select(`
        *,
        funcionarios (nome, email),
        perguntas (texto, ordem)
      `)
      .eq('formulario_id', formularioId);
    
    if (error) throw error;
    
    // Buscar total de funcionários da empresa
    const { data: formulario } = await supabase
      .from('formularios')
      .select('empresa_id')
      .eq('id', formularioId)
      .single();
    
    if (!formulario) return null;
    
    const { data: funcionarios } = await supabase
      .from('funcionarios')
      .select('id')
      .eq('empresa_id', formulario.empresa_id)
      .eq('status', 'ativo');
    
    return {
      respostas: respostas || [],
      totalFuncionarios: funcionarios?.length || 0,
    };
  },
};

// Função para obter estatísticas do dashboard
export const dashboardService = {
  async getStats(empresaId: string) {
    // Buscar contadores
    const [empresasResult, funcionariosResult, formulariosResult, respostasResult] = await Promise.all([
      supabase.from('empresas').select('id', { count: 'exact' }).eq('id', empresaId),
      supabase.from('funcionarios').select('id', { count: 'exact' }).eq('empresa_id', empresaId).eq('status', 'ativo'),
      supabase.from('formularios').select('id', { count: 'exact' }).eq('empresa_id', empresaId),
      supabase.from('respostas').select('id', { count: 'exact' }).eq('formulario_id', empresaId), // Isso precisa ser ajustado
    ]);

    return {
      empresas: empresasResult.count || 0,
      funcionarios: funcionariosResult.count || 0,
      formularios: formulariosResult.count || 0,
      respostas: respostasResult.count || 0,
    };
  },
};