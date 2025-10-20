import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { getDashboardStats, DashboardStats } from '../api/reports';
import { getEmergencias, Emergencia } from '../api/emergencias';
import {
  Activity,
  AlertTriangle,
  Users,
  FileText,
  Clock,
  TrendingUp,
  Loader2,
  Eye,
  Heart,
  Droplet
} from 'lucide-react';
import { toast } from 'sonner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function Monitoring() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [emergenciasActivas, setEmergenciasActivas] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    // Auto-refresh cada 30 segundos
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [statsData, emergenciasData] = await Promise.all([
        getDashboardStats(),
        getEmergencias({ estado: 'en_traslado', per_page: 10 })
      ]);
      setStats(statsData);
      setEmergenciasActivas(emergenciasData.data);
    } catch (error: any) {
      toast.error('Error al cargar datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getCriticidadColor = (critico: boolean) => {
    return critico ? 'bg-red-100 border-red-300' : 'bg-white';
  };

  const getEstadoConfig = (estado: string) => {
    const configs: Record<string, { label: string; color: string; bgColor: string; iconColor: string }> = {
      'en_camino': { label: 'En Camino', color: 'bg-blue-100 text-blue-800', bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
      'en_escena': { label: 'En Escena', color: 'bg-purple-100 text-purple-800', bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
      'en_traslado': { label: 'En Traslado', color: 'bg-orange-100 text-orange-800', bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
      'en_hospital': { label: 'En Hospital', color: 'bg-cyan-100 text-cyan-800', bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
      'en_atencion': { label: 'En Atención', color: 'bg-yellow-100 text-yellow-800', bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
      'estabilizado': { label: 'Estabilizado', color: 'bg-green-100 text-green-800', bgColor: 'bg-green-100', iconColor: 'text-green-600' },
      'dado_alta': { label: 'Dado de Alta', color: 'bg-teal-100 text-teal-800', bgColor: 'bg-teal-100', iconColor: 'text-teal-600' },
      'cerrado': { label: 'Cerrado', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-100', iconColor: 'text-gray-600' },
    };
    return configs[estado] || { label: 'Desconocido', color: 'bg-gray-100 text-gray-800', bgColor: 'bg-gray-100', iconColor: 'text-gray-600' };
  };

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Panel de Monitoreo</h1>
          <p className="text-gray-600 mt-2">Vista en tiempo real del estado del sistema</p>
        </div>
        <Button onClick={loadData} variant="outline" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Activity className="mr-2 h-4 w-4" />}
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Pacientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {stats?.totales.pacientes || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Total registrados</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              En Traslado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {stats?.totales.emergencias_activas || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Emergencias activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Hoy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats?.totales.emergencias_hoy || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Emergencias hoy</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Consultas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">
              {stats?.totales.consultas_semana || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Esta semana</p>
          </CardContent>
        </Card>

        <Card className={stats?.totales.pacientes_criticos && stats.totales.pacientes_criticos > 0 ? 'border-red-300 bg-red-50' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Críticos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {stats?.totales.pacientes_criticos || 0}
            </div>
            <p className="text-xs text-gray-500 mt-1">Pacientes críticos</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Emergencias Activas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                Emergencias en Traslado
              </span>
              <Badge variant="secondary">{emergenciasActivas.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {emergenciasActivas.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Clock className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                <p>No hay emergencias en traslado</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {emergenciasActivas.map((emergencia) => (
                  <div
                    key={emergencia.id}
                    className={`p-4 border rounded-lg ${getCriticidadColor(emergencia.alerta_critica)} cursor-pointer hover:shadow-md transition-shadow`}
                    onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="font-semibold text-gray-900">{emergencia.paciente_nombre}</div>
                        <div className="text-sm text-gray-600">Unidad: {emergencia.unidad}</div>
                      </div>
                      {emergencia.alerta_critica && (
                        <Badge className="bg-red-100 text-red-800 border-red-300">
                          <AlertTriangle className="mr-1 h-3 w-3" />
                          CRÍTICO
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {emergencia.signos_vitales.pa && (
                        <div className="flex items-center gap-1">
                          <Activity className="h-3 w-3 text-red-600" />
                          <span className="text-gray-700">PA: {emergencia.signos_vitales.pa}</span>
                        </div>
                      )}
                      {emergencia.signos_vitales.spo2 && (
                        <div className="flex items-center gap-1">
                          <Droplet className="h-3 w-3 text-blue-600" />
                          <span className="text-gray-700">SpO2: {emergencia.signos_vitales.spo2}%</span>
                        </div>
                      )}
                      {emergencia.signos_vitales.pulso && (
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 text-red-600" />
                          <span className="text-gray-700">FC: {emergencia.signos_vitales.pulso} bpm</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2 flex justify-between items-center">
                      <span className="text-xs text-gray-500">
                        {new Date(emergencia.fecha).toLocaleTimeString()}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8"
                        onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gráfica de Emergencias por Día */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Emergencias - Última Semana
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.emergencias_por_dia.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.emergencias_por_dia}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dia" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#3b82f6" name="Emergencias" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <p>No hay datos disponibles</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Últimas Emergencias */}
      {stats && stats.ultimas_emergencias.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.ultimas_emergencias.map((emergencia) => {
                const estadoConfig = getEstadoConfig(emergencia.estado);
                return (
                  <div
                    key={emergencia.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${estadoConfig.bgColor}`}>
                        <AlertTriangle className={`h-4 w-4 ${estadoConfig.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{emergencia.paciente_nombre}</p>
                        <p className="text-sm text-gray-600">Unidad: {emergencia.unidad}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={estadoConfig.color}>
                        {estadoConfig.label}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(emergencia.fecha).toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
