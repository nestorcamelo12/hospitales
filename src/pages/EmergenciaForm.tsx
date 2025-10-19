import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { getPatients, Patient } from '../api/patients';
import { createEmergencia, SignosVitales } from '../api/emergencias';
import { ArrowLeft, AlertTriangle, Send, Loader2, Heart, Activity, Thermometer, Droplet } from 'lucide-react';
import { toast } from 'sonner';

export default function EmergenciaForm() {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const [formData, setFormData] = useState({
    paciente_id: 0,
    unidad: '',
    descripcion: '',
    ubicacion: '',
    signos_vitales: {
      pa: '',
      pulso: '',
      spo2: '',
      temp: ''
    }
  });

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    try {
      const response = await getPatients({ per_page: 100 });
      setPatients(response.data);
    } catch (error: any) {
      toast.error('Error al cargar pacientes');
    }
  };

  const handleSubmit = async () => {
    // Validaciones
    if (!formData.paciente_id) {
      toast.error('Selecciona un paciente');
      return;
    }
    if (!formData.unidad) {
      toast.error('Ingresa el número de unidad');
      return;
    }
    if (!formData.descripcion) {
      toast.error('Describe la emergencia');
      return;
    }

    try {
      setLoading(true);
      
      // Limpiar y formatear signos vitales
      const signos: SignosVitales = {};
      if (formData.signos_vitales.pa) signos.pa = formData.signos_vitales.pa;
      if (formData.signos_vitales.pulso) signos.pulso = parseInt(formData.signos_vitales.pulso);
      if (formData.signos_vitales.spo2) signos.spo2 = parseInt(formData.signos_vitales.spo2);
      if (formData.signos_vitales.temp) signos.temp = parseFloat(formData.signos_vitales.temp);

      await createEmergencia({
        paciente_id: formData.paciente_id,
        unidad: formData.unidad,
        descripcion: formData.descripcion,
        ubicacion: formData.ubicacion,
        signos_vitales: signos
      });

      toast.success('✅ Emergencia registrada. Alerta enviada al hospital.');
      navigate('/emergencias');
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar emergencia');
    } finally {
      setLoading(false);
      setIsConfirmOpen(false);
    }
  };

  const evaluarCriticidad = () => {
    const signos = formData.signos_vitales;
    let critico = false;

    // SpO2 bajo
    if (signos.spo2 && parseInt(signos.spo2) < 90) critico = true;
    
    // Pulso anormal
    if (signos.pulso) {
      const pulso = parseInt(signos.pulso);
      if (pulso < 50 || pulso > 120) critico = true;
    }

    // Presión arterial
    if (signos.pa) {
      const pa = signos.pa.split('/');
      if (pa.length === 2) {
        const sistolica = parseInt(pa[0]);
        const diastolica = parseInt(pa[1]);
        if (sistolica < 90 || sistolica > 180 || diastolica < 60 || diastolica > 120) {
          critico = true;
        }
      }
    }

    return critico;
  };

  const pacienteSeleccionado = patients.find(p => p.id === formData.paciente_id);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      {/* Header */}
      <div className="max-w-2xl mx-auto mb-6">
        <Button variant="ghost" onClick={() => navigate('/emergencias')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-red-100 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Registrar Emergencia</h1>
            <p className="text-gray-600">Unidad de ambulancia</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Paciente */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Datos del Paciente</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="paciente">Paciente *</Label>
              <Select
                value={formData.paciente_id.toString()}
                onValueChange={(value) => setFormData({ ...formData, paciente_id: parseInt(value) })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecciona un paciente" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map((patient) => (
                    <SelectItem key={patient.id} value={patient.id.toString()}>
                      {patient.nombre} - {patient.documento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {pacienteSeleccionado && (
              <div className="p-3 bg-blue-50 rounded-lg text-sm">
                <p><strong>Tipo de Sangre:</strong> {pacienteSeleccionado.tipo_sangre}</p>
                <p><strong>Alergias:</strong> {pacienteSeleccionado.alergias.join(', ') || 'Ninguna'}</p>
                <p><strong>Contacto:</strong> {pacienteSeleccionado.contacto_emergencia}</p>
              </div>
            )}
          </div>
        </div>

        {/* Información de la Emergencia */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4">Información de la Emergencia</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="unidad">Unidad de Ambulancia *</Label>
              <Input
                id="unidad"
                value={formData.unidad}
                onChange={(e) => setFormData({ ...formData, unidad: e.target.value })}
                placeholder="Ej: AMB-23"
                className="mt-1 text-lg"
              />
            </div>

            <div>
              <Label htmlFor="ubicacion">Ubicación Actual</Label>
              <Input
                id="ubicacion"
                value={formData.ubicacion}
                onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                placeholder="Dirección o referencia"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="descripcion">Descripción de la Emergencia *</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Describe el estado del paciente y la situación"
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Signos Vitales */}
        <div className="bg-white rounded-lg shadow p-4 md:p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Signos Vitales
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pa" className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-red-600" />
                Presión Arterial
              </Label>
              <Input
                id="pa"
                value={formData.signos_vitales.pa}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  signos_vitales: { ...formData.signos_vitales, pa: e.target.value }
                })}
                placeholder="120/80"
                className="mt-1 text-lg font-mono"
              />
            </div>

            <div>
              <Label htmlFor="pulso" className="flex items-center gap-2">
                <Heart className="h-4 w-4 text-red-600" />
                Frecuencia Cardíaca
              </Label>
              <Input
                id="pulso"
                type="number"
                value={formData.signos_vitales.pulso}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  signos_vitales: { ...formData.signos_vitales, pulso: e.target.value }
                })}
                placeholder="80"
                className="mt-1 text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">bpm</p>
            </div>

            <div>
              <Label htmlFor="spo2" className="flex items-center gap-2">
                <Droplet className="h-4 w-4 text-blue-600" />
                Saturación de Oxígeno
              </Label>
              <Input
                id="spo2"
                type="number"
                value={formData.signos_vitales.spo2}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  signos_vitales: { ...formData.signos_vitales, spo2: e.target.value }
                })}
                placeholder="98"
                className="mt-1 text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">%</p>
            </div>

            <div>
              <Label htmlFor="temp" className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-orange-600" />
                Temperatura
              </Label>
              <Input
                id="temp"
                type="number"
                step="0.1"
                value={formData.signos_vitales.temp}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  signos_vitales: { ...formData.signos_vitales, temp: e.target.value }
                })}
                placeholder="36.5"
                className="mt-1 text-lg font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">°C</p>
            </div>
          </div>

          {evaluarCriticidad() && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-red-800">⚠️ Signos Vitales Críticos Detectados</p>
                <p className="text-sm text-red-700">El hospital será alertado inmediatamente.</p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-lg shadow-lg space-y-2">
          <Button
            onClick={() => setIsConfirmOpen(true)}
            disabled={loading || !formData.paciente_id || !formData.unidad || !formData.descripcion}
            className="w-full h-14 text-lg bg-red-600 hover:bg-red-700"
          >
            <Send className="mr-2 h-5 w-5" />
            Enviar Alerta al Hospital
          </Button>
          
          <Button
            variant="outline"
            onClick={() => navigate('/emergencias')}
            disabled={loading}
            className="w-full"
          >
            Cancelar
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Confirmar Envío de Alerta
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2 text-left text-sm">
                <div><strong>Paciente:</strong> {pacienteSeleccionado?.nombre}</div>
                <div><strong>Unidad:</strong> {formData.unidad}</div>
                <div><strong>Ubicación:</strong> {formData.ubicacion || 'No especificada'}</div>
                
                {formData.signos_vitales.pa && (
                  <div><strong>PA:</strong> {formData.signos_vitales.pa} mmHg</div>
                )}
                {formData.signos_vitales.pulso && (
                  <div><strong>FC:</strong> {formData.signos_vitales.pulso} bpm</div>
                )}
                {formData.signos_vitales.spo2 && (
                  <div><strong>SpO2:</strong> {formData.signos_vitales.spo2}%</div>
                )}
                
                {evaluarCriticidad() && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800">
                    ⚠️ <strong>CASO CRÍTICO</strong> - Alerta prioritaria
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Revisar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSubmit}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Confirmar y Enviar
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

