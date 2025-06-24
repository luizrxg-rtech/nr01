import {Database, Resposta, supabase} from "@/lib/supabase";

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
