"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, UserPlus, FileText, BarChart3, Settings, Activity } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: string;
}

const StatsCard = ({ title, value, description, icon, trend }: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">
        {trend && <span className="text-green-600">{trend}</span>} {description}
      </p>
    </CardContent>
  </Card>
);

export default function GerenciaContent() {
  const stats = [
    {
      title: "Total Usuarios",
      value: "1,284",
      description: "desde el mes pasado",
      trend: "+12%",
      icon: <Users className="h-4 w-4 text-purple-600" />
    },
    {
      title: "Pacientes Activos",
      value: "856",
      description: "en tratamiento",
      trend: "+8%",
      icon: <Activity className="h-4 w-4 text-green-600" />
    },
    {
      title: "Profesionales",
      value: "42",
      description: "registrados",
      trend: "+2",
      icon: <UserPlus className="h-4 w-4 text-blue-600" />
    },
    {
      title: "Reportes Generados",
      value: "234",
      description: "este mes",
      icon: <FileText className="h-4 w-4 text-orange-600" />
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard de Gerencia</h1>
        <p className="text-gray-600 mt-2">
          Resumen general del sistema y métricas principales
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <StatsCard key={index} {...stat} />
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-purple-600" />
            Acciones Rápidas
          </CardTitle>
          <CardDescription>
            Gestiona los aspectos principales del sistema
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 hover:bg-purple-50 hover:border-purple-200"
          >
            <Users className="h-6 w-6 text-purple-600" />
            <span>Gestionar Usuarios</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 hover:bg-blue-50 hover:border-blue-200"
          >
            <BarChart3 className="h-6 w-6 text-blue-600" />
            <span>Ver Reportes</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-20 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200"
          >
            <Activity className="h-6 w-6 text-green-600" />
            <span>Monitor Sistema</span>
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <CardDescription>
            Últimas acciones realizadas en el sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { action: "Nuevo usuario registrado", user: "Dr. García", time: "Hace 2 horas" },
              { action: "Reporte mensual generado", user: "Sistema", time: "Hace 4 horas" },
              { action: "Configuración actualizada", user: "Admin", time: "Hace 1 día" },
              { action: "Backup automático completado", user: "Sistema", time: "Hace 2 días" }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-600">por {activity.user}</p>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}