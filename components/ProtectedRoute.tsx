'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from "@/components/layout/LoadingScreen";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loadingAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loadingAuth && !user) {
      router.push('/auth');
    }
  }, [user, loadingAuth, router]);

  if (loadingAuth) {
    return (
      <LoadingScreen />
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}