import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { getEmergencias, Emergencia } from '../api/emergencias';
import { AlertTriangle, Plus, Eye, Loader2, Clock, CheckCircle, XCircle, Activity, User } from 'lucide-react';
import { toast } from 'sonner';

export default function Emergencias() {
  const navigate = useNavigate();
  const [emergencias, setEmergencias] = useState<Emergencia[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [estadoFilter, setEstadoFilter] = useState('all');
  const perPage = 20;

  useEffect(() => {
    loadData();
  }, [page, estadoFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await getEmergencias({
        page,
        per_page: perPage,
        estado: estadoFilter === 'all' ? undefined : estadoFilter
      });
      setEmergencias(response.data);
      setTotal(response.meta.total);
      setTotalPages(response.meta.last_page);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar emergencias');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, { label: string; className: string; icon: any }> = {
      en_camino: { label: 'En Camino', className: 'bg-blue-100 text-blue-800', icon: Activity },
      en_escena: { label: 'En Escena', className: 'bg-purple-100 text-purple-800', icon: AlertTriangle },
      en_traslado: { label: 'En Traslado', className: 'bg-orange-100 text-orange-800', icon: Clock },
      en_hospital: { label: 'En Hospital', className: 'bg-yellow-100 text-yellow-800', icon: User },
      en_atencion: { label: 'En Atención', className: 'bg-indigo-100 text-indigo-800', icon: User },
      estabilizado: { label: 'Estabilizado', className: 'bg-green-100 text-green-800', icon: CheckCircle },
      dado_alta: { label: 'Dado de Alta', className: 'bg-teal-100 text-teal-800', icon: CheckCircle },
      cerrado: { label: 'Cerrado', className: 'bg-gray-100 text-gray-800', icon: XCircle },
    };

    const config = badges[estado] || { label: estado, className: 'bg-gray-100 text-gray-800', icon: Activity };
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="mr-1 h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getCriticidadBadge = (critico: boolean) => {
    return critico ? (
      <Badge className="bg-red-100 text-red-800">
        <AlertTriangle className="mr-1 h-3 w-3" />
        CRÍTICO
      </Badge>
    ) : null;
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Emergencias</h1>
        <p className="text-gray-600 mt-2">Monitoreo y gestión de emergencias médicas</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">En Traslado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              <div className="text-2xl font-bold">
                {emergencias.filter(e => e.estado === 'en_traslado').length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Atendidas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div className="text-2xl font-bold">
                {emergencias.filter(e => e.estado === 'atendido' && 
                  new Date(e.fecha).toDateString() === new Date().toDateString()).length}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Casos Críticos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div className="text-2xl font-bold">
                {emergencias.filter(e => e.alerta_critica).length}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={estadoFilter} onValueChange={setEstadoFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Todos los estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              <SelectItem value="en_camino">En Camino</SelectItem>
              <SelectItem value="en_escena">En Escena</SelectItem>
              <SelectItem value="en_traslado">En Traslado</SelectItem>
              <SelectItem value="en_hospital">En Hospital</SelectItem>
              <SelectItem value="en_atencion">En Atención</SelectItem>
              <SelectItem value="estabilizado">Estabilizado</SelectItem>
              <SelectItem value="dado_alta">Dado de Alta</SelectItem>
              <SelectItem value="cerrado">Cerrado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button onClick={() => navigate('/emergencias/new')} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Emergencia
        </Button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      ) : emergencias.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border">
          <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-gray-500 mb-4">No se encontraron emergencias</p>
          <Button onClick={() => navigate('/emergencias/new')}>
            <Plus className="mr-2 h-4 w-4" />
            Registrar Primera Emergencia
          </Button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Unidad</TableHead>
                  <TableHead>Signos Vitales</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emergencias.map((emergencia) => (
                  <TableRow key={emergencia.id} className={emergencia.alerta_critica ? 'bg-red-50' : ''}>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(emergencia.fecha).toLocaleDateString()}
                        <br />
                        <span className="text-xs text-gray-500">
                          {new Date(emergencia.fecha).toLocaleTimeString()}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{emergencia.paciente_nombre}</div>
                        <div className="text-sm text-gray-600">{emergencia.paciente_documento}</div>
                        {emergencia.alerta_critica && (
                          <div className="mt-1">{getCriticidadBadge(true)}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{emergencia.unidad}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-1">
                        {emergencia.signos_vitales.pa && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-red-600" />
                            <span>PA: {emergencia.signos_vitales.pa}</span>
                          </div>
                        )}
                        {emergencia.signos_vitales.spo2 && (
                          <div className="flex items-center gap-1">
                            <Activity className="h-3 w-3 text-green-600" />
                            <span>SpO2: {emergencia.signos_vitales.spo2}%</span>
                          </div>
                        )}
                        {emergencia.signos_vitales.pulso && (
                          <div className="text-xs text-gray-500">
                            FC: {emergencia.signos_vitales.pulso} bpm
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getEstadoBadge(emergencia.estado)}</TableCell>
                    <TableCell className="text-sm">
                      {emergencia.hospital_nombre || 'No asignado'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                        title="Ver detalles"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando {emergencias.length} de {total} emergencias
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-4 text-sm">
                Página {page} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

