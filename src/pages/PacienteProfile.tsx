import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  User,
  FileText,
  Activity,
  AlertTriangle,
  Edit,
  Loader2,
  Calendar,
  Phone,
  MapPin,
  Heart,
  TrendingUp
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getPatient, getPatientMedicalRecords, getPatientEmergencias, getPatientVitals, Patient } from '../api/patients';
import { toast } from 'sonner';

export default function PacienteProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [medicalRecords, setMedicalRecords] = useState<any[]>([]);
  const [emergencias, setEmergencias] = useState<any[]>([]);
  const [vitals, setVitals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => {
    if (id) {
      loadPatientData(parseInt(id));
    }
  }, [id]);

  const loadPatientData = async (patientId: number) => {
    try {
      setLoading(true);
      const [patientData, recordsData, emergenciasData, vitalsData] = await Promise.all([
        getPatient(patientId),
        getPatientMedicalRecords(patientId),
        getPatientEmergencias(patientId),
        getPatientVitals(patientId, 20)
      ]);

      setPatient(patientData);
      setMedicalRecords(recordsData);
      setEmergencias(emergenciasData);
      setVitals(vitalsData);
    } catch (error: any) {
      toast.error(error.message || 'Error al cargar datos del paciente');
      navigate('/pacientes');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Paciente no encontrado</h2>
          <Button className="mt-4" onClick={() => navigate('/pacientes')}>
            Volver a Pacientes
          </Button>
        </div>
      </div>
    );
  }

  const getTipoSangreBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      'O+': 'bg-blue-100 text-blue-800',
      'O-': 'bg-blue-200 text-blue-900',
      'A+': 'bg-green-100 text-green-800',
      'A-': 'bg-green-200 text-green-900',
      'B+': 'bg-purple-100 text-purple-800',
      'B-': 'bg-purple-200 text-purple-900',
      'AB+': 'bg-orange-100 text-orange-800',
      'AB-': 'bg-orange-200 text-orange-900',
    };
    return colors[tipo] || 'bg-gray-100 text-gray-800';
  };

  // Preparar datos para el gráfico de signos vitales
  const prepareVitalsChartData = () => {
    // Agrupar los signos vitales por fecha
    const groupedByDate: Record<string, any> = {};
    
    vitals.forEach((vital) => {
      const date = new Date(vital.fecha).toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: '2-digit' 
      });
      
      if (!groupedByDate[date]) {
        groupedByDate[date] = { fecha: date };
      }
      
      // Mapear tipos de signos vitales
      if (vital.tipo === 'HR' || vital.tipo === 'Pulso') {
        groupedByDate[date].pulso = parseInt(vital.valor);
      } else if (vital.tipo === 'SPO2' || vital.tipo === 'Saturación') {
        groupedByDate[date].spo2 = parseInt(vital.valor);
      } else if (vital.tipo === 'TEMP' || vital.tipo === 'Temperatura') {
        groupedByDate[date].temperatura = parseFloat(vital.valor);
      } else if (vital.tipo === 'BP' || vital.tipo === 'Presión Arterial') {
        // Tomar solo el valor sistólico para el gráfico
        const sistolico = parseInt(vital.valor.split('/')[0]);
        if (!isNaN(sistolico)) {
          groupedByDate[date].presion = sistolico;
        }
      }
    });
    
    // Convertir a array y ordenar por fecha (más recientes primero)
    return Object.values(groupedByDate).reverse().slice(0, 10);
  };

  const chartData = prepareVitalsChartData();

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/pacientes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      {/* Patient Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {patient.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </div>
              <div>
                <CardTitle className="text-2xl">{patient.nombre}</CardTitle>
                <CardDescription className="text-base mt-1">
                  {patient.documento} • {patient.edad} años • {patient.sexo || 'No especificado'}
                </CardDescription>
                <div className="flex gap-2 mt-2">
                  <Badge className={getTipoSangreBadge(patient.tipo_sangre)}>
                    Tipo {patient.tipo_sangre}
                  </Badge>
                  <Badge variant="outline">
                    {patient.hospital_nombre || 'Sin hospital'}
                  </Badge>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate(`/pacientes/${patient.id}/editar`)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="info">
            <User className="h-4 w-4 mr-2" />
            Información
          </TabsTrigger>
          <TabsTrigger value="history">
            <FileText className="h-4 w-4 mr-2" />
            Historial ({medicalRecords.length})
          </TabsTrigger>
          <TabsTrigger value="vitals">
            <Activity className="h-4 w-4 mr-2" />
            Signos Vitales ({vitals.length})
          </TabsTrigger>
          <TabsTrigger value="emergencies">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Emergencias ({emergencias.length})
          </TabsTrigger>
        </TabsList>

        {/* Info Tab */}
        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Fecha de Nacimiento</p>
                <div className="flex items-center gap-2 mt-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{new Date(patient.fecha_nac).toLocaleDateString()}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contacto de Emergencia</p>
                <div className="flex items-center gap-2 mt-1">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{patient.contacto_emergencia || 'No registrado'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Hospital Asignado</p>
                <div className="flex items-center gap-2 mt-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{patient.hospital_nombre || 'No asignado'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Sangre</p>
                <div className="flex items-center gap-2 mt-1">
                  <Heart className="h-4 w-4 text-muted-foreground" />
                  <p className="font-medium">{patient.tipo_sangre}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {patient.alergias && (
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive">Alergias</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.alergias}</p>
              </CardContent>
            </Card>
          )}

          {patient.condiciones_preexistentes && (
            <Card>
              <CardHeader>
                <CardTitle>Condiciones Preexistentes</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{patient.condiciones_preexistentes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Medical History Tab */}
        <TabsContent value="history" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button onClick={() => navigate(`/medical-records/nuevo/${id}`)}>
              <FileText className="h-4 w-4 mr-2" />
              Agregar Registro Médico
            </Button>
          </div>

          {medicalRecords.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No hay registros médicos</p>
              </CardContent>
            </Card>
          ) : (
            medicalRecords.map((record) => (
              <Card key={record.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{new Date(record.fecha).toLocaleDateString()}</CardTitle>
                      <CardDescription>Dr. {record.medico_nombre || 'No especificado'}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium">Motivo de Consulta</p>
                    <p className="text-sm text-muted-foreground">{record.motivo_consulta}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Diagnóstico</p>
                    <p className="text-sm text-muted-foreground">{record.diagnostico}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tratamiento</p>
                    <p className="text-sm text-muted-foreground">{record.tratamiento}</p>
                  </div>
                  {record.observaciones && (
                    <div>
                      <p className="text-sm font-medium">Observaciones</p>
                      <p className="text-sm text-muted-foreground">{record.observaciones}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          {vitals.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No hay signos vitales registrados</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Gráfico de Signos Vitales */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <CardTitle>Evolución de Signos Vitales</CardTitle>
                  </div>
                  <CardDescription>Últimos 10 días con registros</CardDescription>
                </CardHeader>
                <CardContent>
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={350}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="fecha" 
                          style={{ fontSize: '12px' }}
                        />
                        <YAxis style={{ fontSize: '12px' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'hsl(var(--card))', 
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px'
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="pulso" 
                          stroke="#ef4444" 
                          strokeWidth={2}
                          name="Pulso (bpm)"
                          dot={{ fill: '#ef4444' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="spo2" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="SpO₂ (%)"
                          dot={{ fill: '#3b82f6' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="temperatura" 
                          stroke="#f59e0b" 
                          strokeWidth={2}
                          name="Temperatura (°C)"
                          dot={{ fill: '#f59e0b' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="presion" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="Presión Sistólica (mmHg)"
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">No hay suficientes datos para mostrar el gráfico</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Lista de Signos Vitales */}
              <Card>
                <CardHeader>
                  <CardTitle>Historial Detallado</CardTitle>
                  <CardDescription>Todos los registros de signos vitales</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {vitals.map((vital) => (
                      <div key={vital.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                        <div>
                          <p className="font-medium">{vital.tipo}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(vital.fecha).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{vital.valor} {vital.unidad}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* Emergencies Tab */}
        <TabsContent value="emergencies" className="space-y-4">
          {emergencias.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <p className="mt-4 text-muted-foreground">No hay emergencias registradas</p>
              </CardContent>
            </Card>
          ) : (
            emergencias.map((emergencia) => (
              <Card key={emergencia.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{emergencia.tipo_emergencia}</CardTitle>
                      <CardDescription>
                        {new Date(emergencia.fecha).toLocaleString()}
                      </CardDescription>
                    </div>
                    <Badge>{emergencia.estado}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm">{emergencia.descripcion}</p>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>Unidad: {emergencia.unidad}</span>
                    {emergencia.hospital_nombre && (
                      <span>Hospital: {emergencia.hospital_nombre}</span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate(`/emergencias/${emergencia.id}`)}
                  >
                    Ver Detalles
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

