import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Activity, 
  AlertTriangle, 
  FileText,
  Search,
  ArrowUpRight,
  Heart,
  Thermometer,
  Droplet,
  Loader2,
  TrendingUp,
  Download
} from "lucide-react";
import { useAuth } from '../contexts/AuthContext';
import { getDashboardStats, DashboardStats } from '../api/reports';
import { toast } from 'sonner';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/pacientes?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const formatTimeAgo = (fecha: string): string => {
    const now = new Date();
    const past = new Date(fecha);
    const diffMinutes = Math.floor((now.getTime() - past.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Justo ahora';
    if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
    if (diffMinutes < 1440) return `Hace ${Math.floor(diffMinutes / 60)} horas`;
    return `Hace ${Math.floor(diffMinutes / 1440)} días`;
  };

  const getTipoVitalLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
      'BP': 'Presión Arterial',
      'HR': 'Frecuencia Cardíaca',
      'SPO2': 'SpO₂',
      'TEMP': 'Temperatura',
      'GLUCOSE': 'Glucosa'
    };
    return labels[tipo] || tipo;
  };

  const getSeverityColor = (tipo: string, valor: string): string => {
    if (tipo === 'SPO2' && parseInt(valor) < 90) {
      return 'bg-destructive/10 text-destructive border-destructive/20';
    }
    if (tipo === 'HR') {
      const hr = parseInt(valor);
      if (hr < 50 || hr > 120) {
        return 'bg-destructive/10 text-destructive border-destructive/20';
      }
    }
    if (tipo === 'BP') {
      const systolic = parseInt(valor.split('/')[0]);
      if (systolic < 90 || systolic > 180) {
        return 'bg-destructive/10 text-destructive border-destructive/20';
      }
    }
    return 'bg-warning/10 text-warning border-warning/20';
  };

  const getStatusColor = (vital: any): string => {
    if (!vital.signos_vitales) return 'bg-muted text-muted-foreground';
    
    const { spo2, pulso } = vital.signos_vitales;
    
    // Crítico
    if ((spo2 && spo2 < 90) || (pulso && (pulso < 50 || pulso > 120))) {
      return 'bg-destructive text-destructive-foreground';
    }
    
    // Monitoreo
    if ((spo2 && spo2 < 95) || (pulso && (pulso < 60 || pulso > 100))) {
      return 'bg-warning text-warning-foreground';
    }
    
    // Estable
    return 'bg-success text-success-foreground';
  };

  const getStatusLabel = (vital: any): string => {
    if (!vital.signos_vitales) return 'Sin datos';
    
    const { spo2, pulso } = vital.signos_vitales;
    
    if ((spo2 && spo2 < 90) || (pulso && (pulso < 50 || pulso > 120))) {
      return 'Crítico';
    }
    
    if ((spo2 && spo2 < 95) || (pulso && (pulso < 60 || pulso > 100))) {
      return 'Monitoreo';
    }
    
    return 'Estable';
  };

  const handleExportData = () => {
    toast.info('Función de exportación próximamente disponible');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const statsCards = [
    {
      title: "Pacientes Activos",
      value: stats?.totales.pacientes.toString() || "0",
      icon: Users,
      color: "text-blue-600",
      onClick: () => navigate('/pacientes')
    },
    {
      title: "Emergencias Activas",
      value: stats?.totales.emergencias_activas.toString() || "0",
      icon: AlertTriangle,
      color: "text-orange-600",
      onClick: () => navigate('/emergencias?estado=en_traslado')
    },
    {
      title: "Emergencias Hoy",
      value: stats?.totales.emergencias_hoy.toString() || "0",
      icon: Activity,
      color: "text-red-600",
      onClick: () => navigate('/emergencias')
    },
    {
      title: "Consultas esta Semana",
      value: stats?.totales.consultas_semana.toString() || "0",
      icon: FileText,
      color: "text-green-600",
      onClick: () => navigate('/pacientes')
    },
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenido, {user?.name || 'Usuario'}
          </p>
        </div>
        
        {/* Search */}
        <form onSubmit={handleSearch} className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Buscar paciente por nombre o documento..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat) => (
          <Card 
            key={stat.title} 
            className="hover:shadow-md transition-all cursor-pointer hover:scale-105"
            onClick={stat.onClick}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2 h-8 w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  stat.onClick();
                }}
              >
                Ver más <ArrowUpRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pacientes Críticos Card */}
      {stats && stats.totales.pacientes_criticos > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              ⚠️ {stats.totales.pacientes_criticos} Pacientes Críticos
            </CardTitle>
            <CardDescription>Requieren atención prioritaria</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="destructive" 
              onClick={() => navigate('/monitoreo')}
              className="w-full sm:w-auto"
            >
              <Activity className="mr-2 h-4 w-4" />
              Ver Panel de Monitoreo
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Critical Alerts */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Alertas Críticas
            </CardTitle>
            <CardDescription>Signos vitales críticos (últimas 24h)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats?.alertas_criticas && stats.alertas_criticas.length > 0 ? (
              stats.alertas_criticas.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${getSeverityColor(alert.tipo, alert.valor)}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{alert.paciente_nombre}</p>
                      <p className="text-xs opacity-75">{alert.paciente_documento}</p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {formatTimeAgo(alert.fecha)}
                    </Badge>
                  </div>
                  <p className="text-sm font-medium">
                    {getTipoVitalLabel(alert.tipo)}: {alert.valor} {alert.unidad}
                  </p>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="w-full mt-2 h-8"
                    onClick={() => navigate(`/pacientes/${alert.paciente_id}`)}
                  >
                    Ver Detalles <ArrowUpRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hay alertas críticas</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Patients */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Pacientes Recientes</CardTitle>
                <CardDescription>Últimas consultas y monitoreos</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/pacientes')}
              >
                Ver Todos
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.pacientes_recientes && stats.pacientes_recientes.length > 0 ? (
                stats.pacientes_recientes.slice(0, 5).map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/pacientes/${patient.id}`)}
                  >
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                      {patient.nombre.split(" ").map(n => n[0]).join("").substring(0, 2)}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">{patient.nombre}</p>
                        <Badge className={getStatusColor(patient)}>
                          {getStatusLabel(patient)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {patient.edad} años • Tipo {patient.tipo_sangre} • Doc: {patient.documento}
                      </p>
                      {patient.ultima_consulta && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Última consulta: {new Date(patient.ultima_consulta).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Vitals */}
                    {patient.signos_vitales && (
                      <div className="flex gap-4">
                        {patient.signos_vitales.pulso && (
                          <div className="text-center">
                            <Heart className={`h-4 w-4 mx-auto mb-1 ${
                              patient.signos_vitales.pulso < 50 || patient.signos_vitales.pulso > 120
                                ? 'text-destructive'
                                : 'text-green-600'
                            }`} />
                            <p className="text-xs text-muted-foreground">FC</p>
                            <p className="text-sm font-semibold">{patient.signos_vitales.pulso}</p>
                          </div>
                        )}
                        {patient.signos_vitales.spo2 && (
                          <div className="text-center">
                            <Activity className={`h-4 w-4 mx-auto mb-1 ${
                              patient.signos_vitales.spo2 < 90
                                ? 'text-destructive'
                                : 'text-blue-600'
                            }`} />
                            <p className="text-xs text-muted-foreground">SpO₂</p>
                            <p className="text-sm font-semibold">{patient.signos_vitales.spo2}%</p>
                          </div>
                        )}
                        {patient.signos_vitales.pa && (
                          <div className="text-center">
                            <Droplet className="h-4 w-4 text-purple-600 mx-auto mb-1" />
                            <p className="text-xs text-muted-foreground">PA</p>
                            <p className="text-sm font-semibold">{patient.signos_vitales.pa}</p>
                          </div>
                        )}
                      </div>
                    )}

                    <Button variant="outline" size="sm" onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/pacientes/${patient.id}`);
                    }}>
                      Ver Ficha
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No hay pacientes recientes</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Emergencias */}
      {stats?.ultimas_emergencias && stats.ultimas_emergencias.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Últimas Emergencias</CardTitle>
                <CardDescription>Emergencias más recientes del sistema</CardDescription>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/emergencias')}
              >
                Ver Todas
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.ultimas_emergencias.map((emergencia) => (
                <div
                  key={emergencia.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">{emergencia.paciente_nombre}</p>
                      <p className="text-sm text-muted-foreground">
                        Unidad: {emergencia.unidad} • {new Date(emergencia.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <CardDescription>Accesos directos a funciones importantes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/pacientes')}
            >
              <Users className="h-6 w-6 mb-2" />
              Ver Pacientes
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/emergencias')}
            >
              <AlertTriangle className="h-6 w-6 mb-2" />
              Emergencias
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={() => navigate('/monitoreo')}
            >
              <Activity className="h-6 w-6 mb-2" />
              Monitoreo
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col"
              onClick={handleExportData}
            >
              <Download className="h-6 w-6 mb-2" />
              Exportar Datos
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
