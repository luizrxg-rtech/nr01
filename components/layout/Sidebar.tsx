'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {AnimatePresence, motion} from 'framer-motion';
import {cn} from '@/lib/utils';
import {Button} from '@/components/ui/button';
import {BarChart3, Building2, FileText, Home, Menu, MessageSquare, Users, X} from 'lucide-react';
import LoadingScreen from "@/components/layout/LoadingScreen";
import {useLoading} from "@/contexts/LoadingContext";

const navigation = [
  {
    index: 0,
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    index: 1,
    name: 'Cadastro de Empresa',
    href: '/dashboard/empresa',
    icon: Building2,
  },
  {
    index: 2,
    name: 'Funcionários',
    href: '/dashboard/funcionarios',
    icon: Users,
  },
  {
    index: 3,
    name: 'Formulários',
    href: '/dashboard/formularios',
    icon: FileText,
  },
  {
    index: 4,
    name: 'Respostas',
    href: '/dashboard/respostas',
    icon: MessageSquare,
  },
  {
    index: 5,
    name: 'Resultados',
    href: '/dashboard/resultados',
    icon: BarChart3,
  },
];

interface SidebarProps {
  children: React.ReactNode;
}

export default function Sidebar({children}: SidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const {loading} = useLoading();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{opacity: 0}}
            animate={{opacity: 1}}
            exit={{opacity: 0}}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)}/>
            <motion.div
              initial={{x: -300}}
              animate={{x: 0}}
              exit={{x: -300}}
              className="fixed left-0 top-0 bottom-0 w-64 card"
            >
              <SidebarContent pathname={pathname} onClose={() => setSidebarOpen(false)}/>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="card border-r border-white/20 flex flex-col flex-grow">
          <SidebarContent pathname={pathname}/>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Mobile header */}
        <div
          className="lg:hidden bg-white/80 backdrop-blur-md border-b border-white/20 px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-6 h-6"/>
          </Button>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 brand-gradient rounded flex items-center justify-center">
              <FileText className="w-4 h-4 text-white"/>
            </div>
            <span className="font-semibold text-foreground">Gramed</span>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

function SidebarContent({pathname, onClose}: { pathname: string; onClose?: () => void }) {
  const [abaSelecionada, setAbaSelecionada] = useState(0);

  useEffect(() => {
    navigation.forEach((item) => {
      if (pathname === item.href) setAbaSelecionada(item.index)
    })
  }, [pathname]);

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-6 border-b border-white/20">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white"/>
          </div>
          <h1
            className="text-xl font-bold bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
            Gramed
          </h1>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="ml-auto lg:hidden"
          >
            <X className="w-5 h-5"/>
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="relative flex flex-col px-4 py-6">
        <div
          style={{ top: abaSelecionada * 48}}
          className="absolute mt-6 left-4 flex w-[calc(100%-2rem)] h-10 bg-gradient-to-r from-brand-green to-brand-blue text-white rounded-lg shadow-lg transition-all duration-200"
        />
        <div className="absolute flex flex-col w-[calc(100%-2rem)] space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                }}
                className={cn(
                  'flex items-center px-3 py-2.5 text-sm font-medium rounded-lg group transition-colors duration-200',
                  isActive ? 'text-white' : 'hover:bg-gray-500/10 text-gray-700 hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'w-5 h-5 mr-3 transition-colors',
                  isActive ? 'text-white' : 'text-gray-700 hover:text-foreground'
                )}/>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}