import {Database, Empresa, supabase} from "@/lib/supabase";

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
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getEmpresaIdByUserId(userId: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('empresas')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data?.id ?? null;
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