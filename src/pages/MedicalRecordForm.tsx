import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { getPatient, Patient } from '../api/patients';
import { createMedicalRecord } from '../api/medical-records';
import { toast } from 'sonner';
import Layout from '@/components/Layout';

export default function MedicalRecordForm() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [formData, setFormData] = useState({
    motivo_consulta: '',
    diagnostico: '',
    tratamiento: '',
    observaciones: '',
  });

  useEffect(() => {
    if (patientId) {
      loadPatient(parseInt(patientId));
    }
  }, [patientId]);

  const loadPatient = async (id: number) => {
    try {
      const data = await getPatient(id);
      setPatient(data);
    } catch (error: any) {
      toast.error('Error al cargar paciente');
      navigate('/pacientes');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!formData.motivo_consulta.trim()) {
      toast.error('El motivo de consulta es requerido');
      return;
    }
    if (!formData.diagnostico.trim()) {
      toast.error('El diagnóstico es requerido');
      return;
    }
    if (!formData.tratamiento.trim()) {
      toast.error('El tratamiento es requerido');
      return;
    }

    try {
      setLoading(true);
      
      await createMedicalRecord({
        paciente_id: parseInt(patientId!),
        motivo_consulta: formData.motivo_consulta,
        diagnostico: formData.diagnostico,
        tratamiento: formData.tratamiento,
        observaciones: formData.observaciones || undefined,
      });

      toast.success('Registro médico creado exitosamente');
      navigate(`/pacientes/${patientId}`);
    } catch (error: any) {
      toast.error(error.message || 'Error al crear registro médico');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/pacientes/${patientId}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al Paciente
          </Button>
          
          <h1 className="text-3xl font-bold">Nuevo Registro Médico</h1>
          {patient && (
            <p className="text-muted-foreground mt-2">
              Paciente: <span className="font-semibold">{patient.nombre}</span> - {patient.documento}
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información del Registro</CardTitle>
            <CardDescription>Complete los datos del registro médico</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Motivo de Consulta */}
              <div className="space-y-2">
                <Label htmlFor="motivo_consulta">
                  Motivo de Consulta <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="motivo_consulta"
                  value={formData.motivo_consulta}
                  onChange={(e) => handleChange('motivo_consulta', e.target.value)}
                  placeholder="Describa el motivo de la consulta"
                  rows={3}
                  required
                />
              </div>

              {/* Diagnóstico */}
              <div className="space-y-2">
                <Label htmlFor="diagnostico">
                  Diagnóstico <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="diagnostico"
                  value={formData.diagnostico}
                  onChange={(e) => handleChange('diagnostico', e.target.value)}
                  placeholder="Escriba el diagnóstico"
                  rows={3}
                  required
                />
              </div>

              {/* Tratamiento */}
              <div className="space-y-2">
                <Label htmlFor="tratamiento">
                  Tratamiento <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="tratamiento"
                  value={formData.tratamiento}
                  onChange={(e) => handleChange('tratamiento', e.target.value)}
                  placeholder="Describa el tratamiento prescrito"
                  rows={3}
                  required
                />
              </div>

              {/* Observaciones */}
              <div className="space-y-2">
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  value={formData.observaciones}
                  onChange={(e) => handleChange('observaciones', e.target.value)}
                  placeholder="Observaciones adicionales (opcional)"
                  rows={3}
                />
              </div>

              {/* Botones */}
              <div className="flex gap-3 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(`/pacientes/${patientId}`)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Registro
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

