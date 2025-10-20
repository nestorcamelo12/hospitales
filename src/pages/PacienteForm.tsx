import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, UserPlus } from "lucide-react";
import { getPatient, createPatient, updatePatient, Patient } from '../api/patients';
import { getHospitals } from '../api/hospitals';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

export default function PacienteForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nombre: '',
    documento: '',
    fecha_nac: '',
    sexo: 'M',
    tipo_sangre: 'O+',
    contacto_emergencia: '',
    hospital_id: '',
    alergias: '',
    condiciones_preexistentes: '',
  });

  useEffect(() => {
    loadHospitals();
    if (isEditing && id) {
      loadPatient(parseInt(id));
    }
  }, [id]);

  const loadHospitals = async () => {
    try {
      const data = await getHospitals();
      setHospitals(data);
    } catch (error: any) {
      toast.error('Error al cargar hospitales');
    }
  };

  const loadPatient = async (patientId: number) => {
    try {
      setLoading(true);
      const patient = await getPatient(patientId);
      setFormData({
        nombre: patient.nombre || '',
        documento: patient.documento || '',
        fecha_nac: patient.fecha_nac ? patient.fecha_nac.split('T')[0] : '',
        sexo: patient.sexo || 'M',
        tipo_sangre: patient.tipo_sangre || 'O+',
        contacto_emergencia: patient.contacto_emergencia || '',
        hospital_id: patient.hospital_id?.toString() || '',
        alergias: patient.alergias || '',
        condiciones_preexistentes: patient.condiciones_preexistentes || '',
      });
    } catch (error: any) {
      toast.error('Error al cargar paciente');
      navigate('/pacientes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.nombre.trim()) {
      toast.error('El nombre es requerido');
      return;
    }
    if (!formData.documento.trim()) {
      toast.error('El documento es requerido');
      return;
    }
    if (!formData.fecha_nac) {
      toast.error('La fecha de nacimiento es requerida');
      return;
    }

    try {
      setLoading(true);
      
      const dataToSend = {
        ...formData,
        hospital_id: formData.hospital_id ? parseInt(formData.hospital_id) : undefined,
      };

      if (isEditing && id) {
        await updatePatient(parseInt(id), dataToSend);
        toast.success('Paciente actualizado exitosamente');
      } else {
        await createPatient(dataToSend);
        toast.success('Paciente creado exitosamente');
      }
      
      navigate('/pacientes');
    } catch (error: any) {
      toast.error(error.message || `Error al ${isEditing ? 'actualizar' : 'crear'} paciente`);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (loading && isEditing) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/pacientes')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>

        {/* Form Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <Save className="h-6 w-6 text-primary" />
              ) : (
                <UserPlus className="h-6 w-6 text-primary" />
              )}
              <div>
                <CardTitle>{isEditing ? 'Editar Paciente' : 'Nuevo Paciente'}</CardTitle>
                <CardDescription>
                  {isEditing 
                    ? 'Actualiza la información del paciente' 
                    : 'Completa el formulario para registrar un nuevo paciente'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Personal</h3>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre Completo *</Label>
                    <Input
                      id="nombre"
                      value={formData.nombre}
                      onChange={(e) => handleChange('nombre', e.target.value)}
                      placeholder="Ej: Juan Pérez García"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="documento">Documento de Identidad *</Label>
                    <Input
                      id="documento"
                      value={formData.documento}
                      onChange={(e) => handleChange('documento', e.target.value)}
                      placeholder="Ej: 12345678"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_nac">Fecha de Nacimiento *</Label>
                    <Input
                      id="fecha_nac"
                      type="date"
                      value={formData.fecha_nac}
                      onChange={(e) => handleChange('fecha_nac', e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sexo">Sexo</Label>
                    <Select value={formData.sexo} onValueChange={(value) => handleChange('sexo', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M">Masculino</SelectItem>
                        <SelectItem value="F">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                    <Select value={formData.tipo_sangre} onValueChange={(value) => handleChange('tipo_sangre', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contacto_emergencia">Contacto de Emergencia</Label>
                    <Input
                      id="contacto_emergencia"
                      value={formData.contacto_emergencia}
                      onChange={(e) => handleChange('contacto_emergencia', e.target.value)}
                      placeholder="Ej: +57 300 123 4567"
                    />
                  </div>
                </div>
              </div>

              {/* Asignación Hospital */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Asignación</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="hospital_id">Hospital</Label>
                  <Select value={formData.hospital_id || "0"} onValueChange={(value) => handleChange('hospital_id', value === "0" ? "" : value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar hospital..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Sin hospital</SelectItem>
                      {hospitals.map((hospital) => (
                        <SelectItem key={hospital.id} value={hospital.id.toString()}>
                          {hospital.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Información Médica */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Información Médica</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias</Label>
                  <Textarea
                    id="alergias"
                    value={formData.alergias}
                    onChange={(e) => handleChange('alergias', e.target.value)}
                    placeholder="Describe las alergias del paciente..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condiciones_preexistentes">Condiciones Preexistentes</Label>
                  <Textarea
                    id="condiciones_preexistentes"
                    value={formData.condiciones_preexistentes}
                    onChange={(e) => handleChange('condiciones_preexistentes', e.target.value)}
                    placeholder="Describe las condiciones médicas preexistentes..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 justify-end pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/pacientes')}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {isEditing ? 'Actualizando...' : 'Guardando...'}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Actualizar Paciente' : 'Guardar Paciente'}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

