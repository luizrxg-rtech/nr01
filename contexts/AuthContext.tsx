'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { auth, type AuthUser } from '@/lib/auth';
import {empresaService} from "@/services/empresa";

interface AuthContextType {
  user: AuthUser | null
  loadingAuth: boolean
  empresaId: string | null
  setEmpresaId: (id: string | null) => void
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [empresaId, setEmpresaId] = useState<string | null>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)

  useEffect(() => {
    // Verificar usuário atual
    auth.getCurrentUser().then((user) => {
      setUser(user)
      setLoadingAuth(false)
    })

    // Escutar mudanças de autenticação
    const { data: { subscription } } = auth.onAuthStateChange((user) => {
      setUser(user)
      setLoadingAuth(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      getEmpresaId()
        .then((id) => {
          if (id) setEmpresaId(id)
        })
    }
  }, [user])

  const getEmpresaId = async () => {
    if (!user) return

    setLoadingAuth(true)

    try {
      return await empresaService.getEmpresaIdByUserId(user.id)
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingAuth(false)
    }
  }

  const signIn = async (email: string, password: string) => {
    await auth.signIn(email, password)
  };

  const signUp = async (email: string, password: string) => {
    await auth.signUp(email, password)
  }

  const signOut = async () => {
    await auth.signOut()
  }

  return (
    <AuthContext.Provider value={{
      user,
      loadingAuth,
      empresaId,
      setEmpresaId,
      signIn,
      signUp,
      signOut,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}