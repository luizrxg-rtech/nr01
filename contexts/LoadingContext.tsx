'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

interface LoadingContextType {
  loading: boolean
  setLoading: (value: boolean) => void
  setLoadingWithDelay: (value: boolean, delay?: number) => void
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined)

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoadingState] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const loadingCountRef = useRef(0)

  const setLoading = useCallback((value: boolean) => {
    if (value) {
      loadingCountRef.current += 1
      setLoadingState(true)
    } else {
      loadingCountRef.current = Math.max(0, loadingCountRef.current - 1)
      if (loadingCountRef.current === 0) {
        setLoadingState(false)
      }
    }
  }, [])

  const setLoadingWithDelay = useCallback((value: boolean, delay: number = 300) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    if (value) {
      timeoutRef.current = setTimeout(() => {
        setLoading(true)
      }, delay)
    } else {
      setLoading(false)
    }
  }, [setLoading])

  return (
    <LoadingContext.Provider value={{
      loading,
      setLoading,
      setLoadingWithDelay
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