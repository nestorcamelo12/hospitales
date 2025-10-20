import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  AlertTriangle,
  ArrowLeft,
  User,
  MapPin,
  Clock,
  Activity,
  Heart,
  Thermometer,
  Droplet,
  Hospital,
  Ambulance,
  UserCheck,
  FileText,
  Loader2,
  Edit,
  History,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';

type EstadoEmergencia = 'en_camino' | 'en_escena' | 'en_traslado' | 'en_hospital' | 'en_atencion' | 'estabilizado' | 'dado_alta' | 'cerrado';

interface HistorialEstado {
  id: number;
  estado_anterior: string;
  estado_nuevo: string;
  usuario_nombre: string;
  observaciones: string | null;
  created_at: string;
}

interface SignosVitales {
  pa?: string;
  pulso?: number;
  spo2?: number;
  temp?: number;
  fc?: number;
}

interface VitalHistory {
  id: number;
  fecha: string;
  tipo: string;
  valor: string;
  unidad: string;
  registrado_por: number;
  notas: string | null;
}

interface EmergenciaDetail {
  id: number;
  paciente_id: number;
  paciente_nombre: string;
  paciente_documento: string;
  paciente_tipo_sangre: string;
  paciente_alergias: string[];
  fecha: string;
  signos_vitales: SignosVitales;
  unidad: string;
  descripcion: string;
  ubicacion: string | null;
  geo_lat: number | null;
  geo_long: number | null;
  estado: EstadoEmergencia;
  hospital_destino_id: number | null;
  hospital_nombre: string | null;
  registrado_por: number;
  paramedico_nombre: string;
  atendido_por: number | null;
  medico_nombre: string | null;
  historial_estados: HistorialEstado[];
  vitals_history: VitalHistory[];
  created_at: string;
  updated_at: string | null;
}

export default function EmergenciaDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emergencia, setEmergencia] = useState<EmergenciaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Estados para cambio de estado
  const [showEstadoDialog, setShowEstadoDialog] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState<EstadoEmergencia | ''>('');
  const [observaciones, setObservaciones] = useState('');
  const [actualizando, setActualizando] = useState(false);

  // Estados para signos vitales
  const [showVitalesDialog, setShowVitalesDialog] = useState(false);
  const [signosVitales, setSignosVitales] = useState<SignosVitales>({
    pa: '',
    pulso: undefined,
    spo2: undefined,
    temp: undefined,
  });
  const [actualizandoVitales, setActualizandoVitales] = useState(false);

  useEffect(() => {
    loadEmergencia();
  }, [id]);

  const loadEmergencia = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/emergencias/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar emergencia');
      }

      const data = await response.json();
      setEmergencia(data.data);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar emergencia');
      navigate('/emergencias');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoConfig = (estado: string) => {
    const configs: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; color: string; icon: any }> = {
      en_camino: { label: 'En Camino', variant: 'default', color: 'bg-blue-100 text-blue-800', icon: Ambulance },
      en_escena: { label: 'En Escena', variant: 'default', color: 'bg-purple-100 text-purple-800', icon: AlertCircle },
      en_traslado: { label: 'En Traslado', variant: 'default', color: 'bg-orange-100 text-orange-800', icon: Ambulance },
      en_hospital: { label: 'En Hospital', variant: 'secondary', color: 'bg-yellow-100 text-yellow-800', icon: Hospital },
      en_atencion: { label: 'En Atención', variant: 'secondary', color: 'bg-indigo-100 text-indigo-800', icon: UserCheck },
      estabilizado: { label: 'Estabilizado', variant: 'outline', color: 'bg-green-100 text-green-800', icon: CheckCircle },
      dado_alta: { label: 'Dado de Alta', variant: 'outline', color: 'bg-teal-100 text-teal-800', icon: CheckCircle },
      cerrado: { label: 'Cerrado', variant: 'outline', color: 'bg-gray-100 text-gray-800', icon: XCircle },
    };
    return configs[estado] || configs.en_camino;
  };

  const getEstadosDisponibles = (): EstadoEmergencia[] => {
    const roleId = user?.role_id;
    
    if (roleId === 1) {
      return ['en_camino', 'en_escena', 'en_traslado', 'en_hospital', 'en_atencion', 'estabilizado', 'dado_alta', 'cerrado'];
    }
    
    if (roleId === 3) {
      return ['en_camino', 'en_escena', 'en_traslado', 'en_hospital'];
    }
    
    if (roleId === 2) {
      return ['en_hospital', 'en_atencion', 'estabilizado', 'dado_alta', 'cerrado'];
    }
    
    return [];
  };

  const handleCambiarEstado = () => {
    if (!estadoSeleccionado) {
      toast.error('Selecciona un estado');
      return;
    }
    
    setShowEstadoDialog(true);
  };

  const confirmarCambioEstado = async () => {
    if (!estadoSeleccionado) return;

    try {
      setActualizando(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/emergencias/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estado: estadoSeleccionado,
          observaciones: observaciones || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar estado');
      }

      toast.success('Estado actualizado exitosamente');
      setShowEstadoDialog(false);
      setEstadoSeleccionado('');
      setObservaciones('');
      loadEmergencia();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar estado');
    } finally {
      setActualizando(false);
    }
  };

  const handleAbrirVitalesDialog = () => {
    // Pre-cargar con los valores actuales
    if (emergencia) {
      setSignosVitales({
        pa: emergencia.signos_vitales.pa || '',
        pulso: emergencia.signos_vitales.pulso,
        spo2: emergencia.signos_vitales.spo2,
        temp: emergencia.signos_vitales.temp,
      });
    }
    setShowVitalesDialog(true);
  };

  const confirmarActualizarVitales = async () => {
    try {
      setActualizandoVitales(true);
      const token = localStorage.getItem('token');
      
      // Preparar signos vitales (solo enviar los que tienen valor)
      const vitalesActualizados: any = {};
      if (signosVitales.pa && signosVitales.pa.trim()) vitalesActualizados.pa = signosVitales.pa;
      if (signosVitales.pulso) vitalesActualizados.pulso = signosVitales.pulso;
      if (signosVitales.spo2) vitalesActualizados.spo2 = signosVitales.spo2;
      if (signosVitales.temp) vitalesActualizados.temp = signosVitales.temp;

      if (Object.keys(vitalesActualizados).length === 0) {
        toast.error('Ingresa al menos un signo vital');
        return;
      }

      const response = await fetch(`http://localhost:8000/api/emergencias/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signos_vitales: vitalesActualizados,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar signos vitales');
      }

      toast.success('Signos vitales actualizados exitosamente');
      setShowVitalesDialog(false);
      loadEmergencia();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar signos vitales');
    } finally {
      setActualizandoVitales(false);
    }
  };

  const evaluarCriticidad = () => {
    if (!emergencia?.signos_vitales) return false;
    const sv = emergencia.signos_vitales;
    return (
      (sv.spo2 && sv.spo2 < 90) ||
      (sv.pulso && (sv.pulso < 50 || sv.pulso > 120)) ||
      (sv.fc && (sv.fc < 50 || sv.fc > 120))
    );
  };

  const getVitalTipo = (tipo: string): { label: string; icon: any; color: string } => {
    const tipos: Record<string, any> = {
      BP: { label: 'Presión Arterial', icon: Heart, color: 'text-blue-600' },
      HR: { label: 'Frecuencia Cardíaca', icon: Activity, color: 'text-green-600' },
      SPO2: { label: 'Saturación O2', icon: Droplet, color: 'text-cyan-600' },
      TEMP: { label: 'Temperatura', icon: Thermometer, color: 'text-orange-600' },
      GLUCOSE: { label: 'Glucosa', icon: Droplet, color: 'text-purple-600' },
    };
    return tipos[tipo] || { label: tipo, icon: Activity, color: 'text-gray-600' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!emergencia) {
    return (
      <div className="p-8">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">Emergencia no encontrada</p>
          <Button onClick={() => navigate('/emergencias')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
      </div>
    );
  }

  const estadoConfig = getEstadoConfig(emergencia.estado);
  const EstadoIcon = estadoConfig.icon;
  const esCritico = evaluarCriticidad();
  const estadosDisponibles = getEstadosDisponibles();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="mb-4 md:mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/emergencias')}
          className="mb-3 md:mb-4 text-xs md:text-sm"
        >
          <ArrowLeft className="mr-2 h-3 w-3 md:h-4 md:w-4" />
          Volver a Emergencias
        </Button>

        <div className="flex flex-col sm:flex-row items-start justify-between gap-3 md:gap-4">
          <div className="min-w-0 flex-1 w-full">
            <div className="flex items-center gap-2 md:gap-3 mb-2 flex-wrap">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                Emergencia #{emergencia.id}
              </h1>
              <Badge className={`flex items-center gap-1 ${estadoConfig.color} text-[10px] md:text-xs flex-shrink-0`}>
                <EstadoIcon className="h-2 w-2 md:h-3 md:w-3" />
                {estadoConfig.label}
              </Badge>
              {esCritico && (
                <Badge variant="destructive" className="animate-pulse text-[10px] md:text-xs flex-shrink-0">
                  🚨 CRÍTICO
                </Badge>
              )}
            </div>
            <p className="text-xs md:text-sm text-gray-600">
              Registrada el {new Date(emergencia.fecha).toLocaleString('es', { 
                dateStyle: 'medium', 
                timeStyle: 'short' 
              })}
            </p>
          </div>

          {/* Selector de Estado */}
          {estadosDisponibles.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto flex-shrink-0">
              <Select
                value={estadoSeleccionado}
                onValueChange={(value) => setEstadoSeleccionado(value as EstadoEmergencia)}
              >
                <SelectTrigger className="w-full sm:w-[200px] text-xs md:text-sm">
                  <SelectValue placeholder="Cambiar estado..." />
                </SelectTrigger>
                <SelectContent>
                  {estadosDisponibles.map((estado) => {
                    const config = getEstadoConfig(estado);
                    const Icon = config.icon;
                    return (
                      <SelectItem key={estado} value={estado}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Button
                onClick={handleCambiarEstado}
                disabled={!estadoSeleccionado || estadoSeleccionado === emergencia.estado}
                className="text-xs md:text-sm flex-1 sm:flex-initial"
              >
                <Edit className="mr-2 h-3 w-3 md:h-4 md:w-4" />
                Actualizar
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Alerta Crítica */}
      {esCritico && (
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-red-50 border-l-4 border-red-500 rounded">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-red-600 flex-shrink-0" />
            <p className="text-xs md:text-sm text-red-800 font-semibold">
              Signos vitales críticos detectados - Requiere atención inmediata
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Columna Principal */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* Información del Paciente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                <User className="h-4 w-4 md:h-5 md:w-5" />
                Información del Paciente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 md:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nombre</p>
                  <p className="font-semibold">{emergencia.paciente_nombre}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Documento</p>
                  <p className="font-semibold">{emergencia.paciente_documento}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Tipo de Sangre</p>
                  <Badge variant="outline" className="mt-1">
                    {emergencia.paciente_tipo_sangre}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Alergias</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {emergencia.paciente_alergias && emergencia.paciente_alergias.length > 0 ? (
                      emergencia.paciente_alergias.map((alergia, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {alergia}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-gray-500">Ninguna</span>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Signos Vitales */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Signos Vitales Actuales
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleAbrirVitalesDialog}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {emergencia.signos_vitales.pa && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-medium text-blue-900">Presión Arterial</p>
                    </div>
                    <p className="text-2xl font-bold text-blue-600">
                      {emergencia.signos_vitales.pa}
                    </p>
                    <p className="text-xs text-blue-700">mmHg</p>
                  </div>
                )}

                {(emergencia.signos_vitales.pulso || emergencia.signos_vitales.fc) && (
                  <div className={`p-4 rounded-lg ${
                    (emergencia.signos_vitales.pulso && (emergencia.signos_vitales.pulso < 50 || emergencia.signos_vitales.pulso > 120)) ||
                    (emergencia.signos_vitales.fc && (emergencia.signos_vitales.fc < 50 || emergencia.signos_vitales.fc > 120))
                      ? 'bg-red-50'
                      : 'bg-green-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Activity className={`h-5 w-5 ${
                        (emergencia.signos_vitales.pulso && (emergencia.signos_vitales.pulso < 50 || emergencia.signos_vitales.pulso > 120)) ||
                        (emergencia.signos_vitales.fc && (emergencia.signos_vitales.fc < 50 || emergencia.signos_vitales.fc > 120))
                          ? 'text-red-600'
                          : 'text-green-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        (emergencia.signos_vitales.pulso && (emergencia.signos_vitales.pulso < 50 || emergencia.signos_vitales.pulso > 120)) ||
                        (emergencia.signos_vitales.fc && (emergencia.signos_vitales.fc < 50 || emergencia.signos_vitales.fc > 120))
                          ? 'text-red-900'
                          : 'text-green-900'
                      }`}>FC</p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      (emergencia.signos_vitales.pulso && (emergencia.signos_vitales.pulso < 50 || emergencia.signos_vitales.pulso > 120)) ||
                      (emergencia.signos_vitales.fc && (emergencia.signos_vitales.fc < 50 || emergencia.signos_vitales.fc > 120))
                        ? 'text-red-600'
                        : 'text-green-600'
                    }`}>
                      {emergencia.signos_vitales.pulso || emergencia.signos_vitales.fc}
                    </p>
                    <p className={`text-xs ${
                      (emergencia.signos_vitales.pulso && (emergencia.signos_vitales.pulso < 50 || emergencia.signos_vitales.pulso > 120)) ||
                      (emergencia.signos_vitales.fc && (emergencia.signos_vitales.fc < 50 || emergencia.signos_vitales.fc > 120))
                        ? 'text-red-700'
                        : 'text-green-700'
                    }`}>bpm</p>
                  </div>
                )}

                {emergencia.signos_vitales.spo2 && (
                  <div className={`p-4 rounded-lg ${
                    emergencia.signos_vitales.spo2 < 90 ? 'bg-red-50' : 'bg-green-50'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Droplet className={`h-5 w-5 ${
                        emergencia.signos_vitales.spo2 < 90 ? 'text-red-600' : 'text-green-600'
                      }`} />
                      <p className={`text-sm font-medium ${
                        emergencia.signos_vitales.spo2 < 90 ? 'text-red-900' : 'text-green-900'
                      }`}>SpO2</p>
                    </div>
                    <p className={`text-2xl font-bold ${
                      emergencia.signos_vitales.spo2 < 90 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {emergencia.signos_vitales.spo2}%
                    </p>
                    <p className={`text-xs ${
                      emergencia.signos_vitales.spo2 < 90 ? 'text-red-700' : 'text-green-700'
                    }`}>Saturación</p>
                  </div>
                )}

                {emergencia.signos_vitales.temp && (
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Thermometer className="h-5 w-5 text-orange-600" />
                      <p className="text-sm font-medium text-orange-900">Temperatura</p>
                    </div>
                    <p className="text-2xl font-bold text-orange-600">
                      {emergencia.signos_vitales.temp}°
                    </p>
                    <p className="text-xs text-orange-700">Celsius</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Historial de Signos Vitales */}
          {emergencia.vitals_history && emergencia.vitals_history.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Historial de Signos Vitales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {emergencia.vitals_history.slice(0, 10).map((vital) => {
                    const vitalConfig = getVitalTipo(vital.tipo);
                    const VitalIcon = vitalConfig.icon;
                    
                    return (
                      <div key={vital.id} className="flex gap-4 pb-3 border-b last:border-0">
                        <div className="flex-shrink-0 w-24 text-sm text-gray-500">
                          {new Date(vital.fecha).toLocaleString('es', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex-shrink-0">
                          <VitalIcon className={`h-5 w-5 ${vitalConfig.color}`} />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{vitalConfig.label}:</span>
                            <span className="text-lg font-bold text-gray-900">
                              {vital.valor} {vital.unidad}
                            </span>
                          </div>
                          {vital.notas && (
                            <p className="text-sm text-gray-600 mt-1">{vital.notas}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {emergencia.vitals_history.length > 10 && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-gray-500">
                      Mostrando los últimos 10 de {emergencia.vitals_history.length} registros
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Descripción de la Emergencia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Descripción del Caso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{emergencia.descripcion}</p>
            </CardContent>
          </Card>

          {/* Historial de Estados */}
          {emergencia.historial_estados && emergencia.historial_estados.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <History className="h-4 w-4 md:h-5 md:w-5" />
                  Historial de Estados
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 md:space-y-3">
                  {emergencia.historial_estados.map((historial) => {
                    const anteriorConfig = getEstadoConfig(historial.estado_anterior);
                    const nuevoConfig = getEstadoConfig(historial.estado_nuevo);
                    const AnteriorIcon = anteriorConfig.icon;
                    const NuevoIcon = nuevoConfig.icon;

                    return (
                      <div key={historial.id} className="flex flex-col sm:flex-row gap-2 sm:gap-4 pb-2 md:pb-3 border-b last:border-0">
                        <div className="flex-shrink-0 text-xs md:text-sm text-gray-500">
                          {new Date(historial.created_at).toLocaleString('es', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="flex flex-wrap items-center gap-1 md:gap-2 mb-1">
                            <Badge className={`${anteriorConfig.color} text-[10px] md:text-xs flex-shrink-0`}>
                              <AnteriorIcon className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                              <span className="truncate max-w-[80px] sm:max-w-none">{anteriorConfig.label}</span>
                            </Badge>
                            <span className="text-gray-400 flex-shrink-0">→</span>
                            <Badge className={`${nuevoConfig.color} text-[10px] md:text-xs flex-shrink-0`}>
                              <NuevoIcon className="h-2 w-2 md:h-3 md:w-3 mr-1" />
                              <span className="truncate max-w-[80px] sm:max-w-none">{nuevoConfig.label}</span>
                            </Badge>
                          </div>
                          <p className="text-xs md:text-sm text-gray-600 truncate">
                            Por: <span className="font-medium">{historial.usuario_nombre}</span>
                          </p>
                          {historial.observaciones && (
                            <p className="text-xs md:text-sm text-gray-700 mt-1 italic break-words">
                              "{historial.observaciones}"
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Lateral */}
        <div className="space-y-6">
          {/* Ubicación */}
          {emergencia.ubicacion && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4" />
                  Ubicación
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700">{emergencia.ubicacion}</p>
                {emergencia.geo_lat && emergencia.geo_long && (
                  <a
                    href={`https://www.google.com/maps?q=${emergencia.geo_lat},${emergencia.geo_long}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline mt-2 inline-block"
                  >
                    Ver en Google Maps →
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Hospital Destino */}
          {emergencia.hospital_nombre && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hospital className="h-4 w-4" />
                  Hospital Destino
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-semibold">{emergencia.hospital_nombre}</p>
              </CardContent>
            </Card>
          )}

          {/* Unidad de Ambulancia */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Ambulance className="h-4 w-4" />
                Unidad
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">{emergencia.unidad}</p>
            </CardContent>
          </Card>

          {/* Personal */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-4 w-4" />
                Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Registrado por</p>
                <p className="font-medium">{emergencia.paramedico_nombre}</p>
              </div>
              {emergencia.medico_nombre && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-gray-600">Atendido por</p>
                    <p className="font-medium">{emergencia.medico_nombre}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Fechas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                Registro
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-gray-600">Creada</p>
                <p className="font-medium">
                  {new Date(emergencia.created_at).toLocaleString()}
                </p>
              </div>
              {emergencia.updated_at && (
                <div>
                  <p className="text-gray-600">Última actualización</p>
                  <p className="font-medium">
                    {new Date(emergencia.updated_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialog para confirmar cambio de estado */}
      <Dialog open={showEstadoDialog} onOpenChange={setShowEstadoDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Cambio de Estado</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de cambiar el estado de esta emergencia?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center gap-3">
              <Badge className={getEstadoConfig(emergencia.estado).color}>
                {getEstadoConfig(emergencia.estado).label}
              </Badge>
              <span className="text-gray-400">→</span>
              <Badge className={getEstadoConfig(estadoSeleccionado).color}>
                {getEstadoConfig(estadoSeleccionado).label}
              </Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="observaciones">
                Observaciones (opcional)
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Agrega notas sobre este cambio de estado..."
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEstadoDialog(false)}
              disabled={actualizando}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarCambioEstado}
              disabled={actualizando}
            >
              {actualizando ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Confirmar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para actualizar signos vitales */}
      <Dialog open={showVitalesDialog} onOpenChange={setShowVitalesDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Actualizar Signos Vitales</DialogTitle>
            <DialogDescription>
              Ingresa los nuevos valores de signos vitales. Se guardará un registro del cambio.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pa">
                  <Heart className="inline h-4 w-4 mr-1 text-blue-600" />
                  Presión Arterial
                </Label>
                <Input
                  id="pa"
                  placeholder="120/80"
                  value={signosVitales.pa}
                  onChange={(e) => setSignosVitales({ ...signosVitales, pa: e.target.value })}
                />
                <p className="text-xs text-gray-500">mmHg (ej: 120/80)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pulso">
                  <Activity className="inline h-4 w-4 mr-1 text-green-600" />
                  Frecuencia Cardíaca
                </Label>
                <Input
                  id="pulso"
                  type="number"
                  placeholder="80"
                  value={signosVitales.pulso || ''}
                  onChange={(e) => setSignosVitales({ ...signosVitales, pulso: e.target.value ? Number(e.target.value) : undefined })}
                />
                <p className="text-xs text-gray-500">bpm</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="spo2">
                  <Droplet className="inline h-4 w-4 mr-1 text-cyan-600" />
                  Saturación O2
                </Label>
                <Input
                  id="spo2"
                  type="number"
                  placeholder="98"
                  min="0"
                  max="100"
                  value={signosVitales.spo2 || ''}
                  onChange={(e) => setSignosVitales({ ...signosVitales, spo2: e.target.value ? Number(e.target.value) : undefined })}
                />
                <p className="text-xs text-gray-500">% (0-100)</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temp">
                  <Thermometer className="inline h-4 w-4 mr-1 text-orange-600" />
                  Temperatura
                </Label>
                <Input
                  id="temp"
                  type="number"
                  step="0.1"
                  placeholder="36.5"
                  value={signosVitales.temp || ''}
                  onChange={(e) => setSignosVitales({ ...signosVitales, temp: e.target.value ? Number(e.target.value) : undefined })}
                />
                <p className="text-xs text-gray-500">°C</p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 <strong>Nota:</strong> Solo se actualizarán los campos que tengan valor. Deja en blanco los que no quieras cambiar.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowVitalesDialog(false);
                setSignosVitales({ pa: '', pulso: undefined, spo2: undefined, temp: undefined });
              }}
              disabled={actualizandoVitales}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarActualizarVitales}
              disabled={actualizandoVitales}
            >
              {actualizandoVitales ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Activity className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
