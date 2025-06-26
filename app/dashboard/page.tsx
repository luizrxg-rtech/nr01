'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Users, 
  FileText, 
  MessageSquare, 
  BarChart3, 
  TrendingUp,
  CheckCircle,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();

  const stats = [
    {
      title: 'Funcionários Ativos',
      value: '1,247',
      icon: Users,
      trend: '+12.3%',
      color: 'from-brand-blue to-blue-400'
    },
    {
      title: 'Formulários Criados',
      value: '48',
      icon: FileText,
      trend: '+8.1%',
      color: 'from-purple-500 to-purple-400'
    },
    {
      title: 'Respostas Coletadas',
      value: '3,892',
      icon: MessageSquare,
      trend: '+15.2%',
      color: 'from-orange-500 to-orange-400'
    }
  ];

  const quickActions = [
    {
      title: 'Cadastrar Empresa',
      description: 'Registre uma nova empresa no sistema',
      icon: Building2,
      href: '/dashboard/empresa',
      color: 'from-brand-green to-green-400'
    },
    {
      title: 'Gerenciar Funcionários',
      description: 'Importe ou edite dados de funcionários',
      icon: Users,
      href: '/dashboard/funcionarios',
      color: 'from-brand-blue to-blue-400'
    },
    {
      title: 'Criar Formulário',
      description: 'Desenvolva novos formulários personalizados',
      icon: FileText,
      href: '/dashboard/formularios',
      color: 'from-purple-500 to-purple-400'
    },
    {
      title: 'Ver Resultados',
      description: 'Analise dados e métricas coletadas',
      icon: BarChart3,
      href: '/dashboard/resultados',
      color: 'from-orange-500 to-orange-400'
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: 'Nova empresa cadastrada',
      details: 'TechCorp Ltda foi registrada no sistema',
      time: '2 horas atrás',
      icon: Building2,
      status: 'success'
    },
    {
      id: 2,
      action: 'Formulário criado',
      details: 'Avaliação de Satisfação - Q1 2024',
      time: '4 horas atrás',
      icon: FileText,
      status: 'info'
    },
    {
      id: 3,
      action: 'Respostas recebidas',
      details: '45 novas respostas para Pesquisa de Clima',
      time: '6 horas atrás',
      icon: MessageSquare,
      status: 'success'
    },
    {
      id: 4,
      action: 'Funcionários importados',
      details: '23 funcionários adicionados via planilha',
      time: '1 dia atrás',
      icon: Users,
      status: 'pending'
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-gray-600">
          Bem-vindo ao sistema de controle de formulários. Aqui você encontra um resumo de todas as atividades.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <Card className="card hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <div className="flex items-center mt-2 text-sm text-green-600">
                      <TrendingUp className="w-4 h-4 mr-1" />
                      {stat.trend}
                    </div>
                  </div>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Ações rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                >
                  <Button
                    variant="outline"
                    onClick={() => router.push(action.href)}
                    className="h-auto p-4 flex flex-col items-start space-y-2 w-full hover:shadow-lg transition-all duration-300 group"
                  >
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{action.title}</p>
                      <p className="text-xs text-gray-600">{action.description}</p>
                    </div>
                  </Button>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="card">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-foreground">
              Atividade recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-start space-x-4 p-3 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    activity.status === 'success' ? 'bg-green-100 text-green-600' :
                    activity.status === 'info' ? 'bg-blue-100 text-blue-600' :
                    'bg-yellow-100 text-yellow-600'
                  }`}>
                    {activity.status === 'success' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : activity.status === 'info' ? (
                      <activity.icon className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">{activity.action}</p>
                    <p className="text-sm text-gray-600">{activity.details}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}