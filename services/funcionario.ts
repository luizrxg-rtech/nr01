import {Database, type Funcionario, supabase} from "@/lib/supabase";

const handleSupabaseError = (error: any, operation: string) => {
  console.error(`Funcionario service - ${operation} error:`, error);
  
  if (error.message?.includes('Failed to fetch')) {
    throw new Error('Erro de conexão com o servidor. Verifique sua conexão com a internet e tente novamente.');
  }
  
  if (error.code === 'PGRST116') {
    throw new Error('Tabela não encontrada. Verifique se o banco de dados foi configurado corretamente.');
  }
  
  if (error.code === '42501') {
    throw new Error('Sem permissão para acessar os dados. Verifique suas credenciais.');
  }
  
  throw new Error(error.message || `Erro ao ${operation.toLowerCase()}`);
};

export const funcionarioService = {
  async create(funcionario: Database['public']['Tables']['funcionarios']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(funcionario)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'criar funcionário');
      }
      
      return data;
    } catch (error) {
      handleSupabaseError(error, 'criar funcionário');
    }
  },

  async createMany(funcionarios: Database['public']['Tables']['funcionarios']['Insert'][]) {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .insert(funcionarios)
        .select();

      if (error) {
        handleSupabaseError(error, 'criar funcionários');
      }
      
      return data;
    } catch (error) {
      handleSupabaseError(error, 'criar funcionários');
    }
  },

  async getByEmpresaId(empresaId: string): Promise<Funcionario[]> {
    try {
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
        handleSupabaseError(error, 'buscar funcionários');
      }

      console.log('Funcionarios fetched successfully:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('Network or other error:', error);
      handleSupabaseError(error, 'buscar funcionários');
      return []; // This line won't be reached due to throw above, but TypeScript needs it
    }
  },

  async update(id: string, updates: Database['public']['Tables']['funcionarios']['Update']) {
    try {
      const { data, error } = await supabase
        .from('funcionarios')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleSupabaseError(error, 'atualizar funcionário');
      }
      
      return data;
    } catch (error) {
      handleSupabaseError(error, 'atualizar funcionário');
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('funcionarios')
        .delete()
        .eq('id', id);

      if (error) {
        handleSupabaseError(error, 'excluir funcionário');
      }
    } catch (error) {
      handleSupabaseError(error, 'excluir funcionário');
    }
  },
};