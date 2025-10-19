import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  AlertTriangle, 
  Ambulance,
  MapPin,
  Activity,
  Thermometer,
  Heart,
  Droplet
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function Emergencies() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success("Alerta enviada al hospital exitosamente");
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <Layout userRole="paramedic">
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
            <AlertTriangle className="h-8 w-8 text-destructive animate-pulse-glow" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Registro de Emergencia</h1>
          <p className="text-muted-foreground mt-2">Formulario optimizado para ambulancias</p>
        </div>

        {/* Emergency Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ambulance className="h-5 w-5 text-primary" />
              Información del Paciente
            </CardTitle>
            <CardDescription>
              Complete los datos del paciente y signos vitales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Patient Identification */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="document">Documento de Identidad *</Label>
                  <Input
                    id="document"
                    placeholder="Ej: CC 1.234.567"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ambulance">Unidad Ambulancia *</Label>
                  <Input
                    id="ambulance"
                    placeholder="Ej: AMB-23"
                    required
                  />
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  Ubicación
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="location"
                    placeholder="Dirección o coordenadas"
                    className="flex-1"
                  />
                  <Button type="button" variant="outline">
                    Usar GPS
                  </Button>
                </div>
              </div>

              {/* Vital Signs */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Activity className="h-5 w-5 text-primary" />
                  Signos Vitales
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Blood Pressure */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Droplet className="h-4 w-4 text-destructive" />
                      Presión Arterial *
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Sistólica"
                        type="number"
                        required
                      />
                      <span className="flex items-center text-muted-foreground">/</span>
                      <Input
                        placeholder="Diastólica"
                        type="number"
                        required
                      />
                    </div>
                  </div>

                  {/* Heart Rate */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Heart className="h-4 w-4 text-destructive" />
                      Pulso (bpm) *
                    </Label>
                    <Input
                      placeholder="Ej: 72"
                      type="number"
                      required
                    />
                  </div>

                  {/* SpO2 */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary" />
                      SpO₂ (%) *
                    </Label>
                    <Input
                      placeholder="Ej: 95"
                      type="number"
                      min="0"
                      max="100"
                      required
                    />
                  </div>

                  {/* Temperature */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Thermometer className="h-4 w-4 text-warning" />
                      Temperatura (°C)
                    </Label>
                    <Input
                      placeholder="Ej: 36.5"
                      type="number"
                      step="0.1"
                    />
                  </div>
                </div>
              </div>

              {/* Event Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Descripción del Evento *</Label>
                <Textarea
                  id="description"
                  placeholder="Describa los síntomas, circunstancias y observaciones relevantes..."
                  rows={4}
                  required
                />
              </div>

              {/* Status */}
              <div className="p-4 bg-accent rounded-lg border border-border">
                <Label className="text-sm font-medium">Estado del Paciente</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                  >
                    En Traslado
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                  >
                    Atendido
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                  >
                    Estabilizado
                  </Button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                >
                  Guardar Borrador
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-destructive hover:bg-destructive/90"
                  disabled={isSubmitting}
                >
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  {isSubmitting ? "Enviando..." : "Enviar Alerta al Hospital"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-accent/50 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-4 w-4 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Importante</p>
                <p className="text-sm text-muted-foreground">
                  Al enviar esta alerta, el hospital recibirá una notificación inmediata y 
                  preparará el equipo médico necesario. Asegúrese de completar todos los campos obligatorios.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
