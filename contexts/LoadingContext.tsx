'use client';

import { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  loading: boolean
  setLoading: (value: boolean) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoadingState] = useState(false)

  const setLoading = useCallback((value: boolean) => {
    setLoadingState(value)
  }, [])

  return (
    <LoadingContext.Provider value={{
      loading,
      setLoading
    }}>
      {children}
    </LoadingContext.Provider>
  )
}

export function useLoading() {
  const context = useContext(LoadingContext)
  if (context === undefined) {
    throw new Error('useLoading must be used within an LoadingProvider')
  }
  return context
}