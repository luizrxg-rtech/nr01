import {Database, type Funcionario, supabase} from "@/lib/supabase";

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
    console.log('Fetching funcionarios for empresa:', empresaId);
    
    const { data, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('nome');

    if (error) {
      console.error('Supabase error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      throw error;
    }

    console.log('Funcionarios fetched successfully:', data?.length || 0);
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