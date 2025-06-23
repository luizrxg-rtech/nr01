'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Building2, Users, FileText, BarChart3, Shield, Zap } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  const features = [
    {
      icon: Building2,
      title: 'Cadastro de Empresa',
      description: 'Registre sua empresa com dados completos e responsável técnico'
    },
    {
      icon: Users,
      title: 'Gestão de Funcionários',
      description: 'Importe dados de funcionários via planilhas de forma simples'
    },
    {
      icon: FileText,
      title: 'Criação de Formulários',
      description: 'Crie, edite e gerencie formulários personalizados'
    },
    {
      icon: BarChart3,
      title: 'Dashboard Avançado',
      description: 'Visualize resultados e métricas em tempo real'
    },
    {
      icon: Shield,
      title: 'Controle de Respostas',
      description: 'Monitore quem respondeu e acompanhe o progresso'
    },
    {
      icon: Zap,
      title: 'Interface Intuitiva',
      description: 'Design moderno e responsivo para melhor experiência'
    }
  ];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 brand-gradient rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              Gramed
            </h1>
          </div>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="brand-gradient hover:opacity-90 transition-opacity"
          >
            Acessar Sistema
          </Button>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-brand-green to-brand-blue bg-clip-text text-transparent">
              Sistema de Controle de Formulários
            </h2>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed">
              Gerencie formulários empresariais de forma inteligente e eficiente. 
              Uma solução completa para coleta, análise e monitoramento de dados.
            </p>
            <Button 
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="brand-gradient hover:opacity-90 transition-opacity text-lg px-8 py-3"
            >
              Começar Agora
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center mb-16"
          >
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Recursos Principais
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Todas as ferramentas que você precisa para gerenciar formulários empresariais
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <Card className="card p-6 hover:shadow-2xl transition-all duration-300 group">
                  <div className="w-12 h-12 brand-gradient rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-xl font-semibold text-foreground mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <motion.section 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="py-20 px-4"
      >
        <div className="container mx-auto">
          <Card className="card p-12 text-center max-w-4xl mx-auto">
            <h3 className="text-3xl font-bold text-foreground mb-4">
              Pronto para começar?
            </h3>
            <p className="text-gray-600 mb-8 text-lg">
              Transforme a gestão de formulários da sua empresa hoje mesmo
            </p>
            <Button 
              size="lg"
              onClick={() => router.push('/dashboard')}
              className="brand-gradient hover:opacity-90 transition-opacity text-lg px-8 py-3"
            >
              Acessar Dashboard
            </Button>
          </Card>
        </div>
      </motion.section>
    </main>
  );
}