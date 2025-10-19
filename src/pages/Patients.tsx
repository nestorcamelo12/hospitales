import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  Plus, 
  Filter,
  Eye,
  Edit,
  FileText,
  AlertCircle
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Patients() {
  const patients = [
    {
      id: 1,
      name: "María González",
      document: "CC 1.234.567",
      age: 39,
      bloodType: "O+",
      allergies: ["Penicilina"],
      hospital: "Hospital Central UNIPAZ",
      status: "critical",
      avatar: "MG",
    },
    {
      id: 2,
      name: "José Rodríguez",
      document: "CC 2.345.678",
      age: 50,
      bloodType: "A-",
      allergies: [],
      hospital: "Clínica Norte",
      status: "stable",
      avatar: "JR",
    },
    {
      id: 3,
      name: "Ana Martínez",
      document: "CC 3.456.789",
      age: 28,
      bloodType: "AB+",
      allergies: ["Aspirina", "Ibuprofeno"],
      hospital: "Hospital Central UNIPAZ",
      status: "monitoring",
      avatar: "AM",
    },
    {
      id: 4,
      name: "Carlos Hernández",
      document: "CC 4.567.890",
      age: 45,
      bloodType: "B+",
      allergies: [],
      hospital: "Hospital Central UNIPAZ",
      status: "stable",
      avatar: "CH",
    },
    {
      id: 5,
      name: "Laura Torres",
      document: "CC 5.678.901",
      age: 33,
      bloodType: "O-",
      allergies: ["Látex"],
      hospital: "Clínica Norte",
      status: "stable",
      avatar: "LT",
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "critical":
        return "bg-destructive text-destructive-foreground";
      case "monitoring":
        return "bg-warning text-warning-foreground";
      case "stable":
        return "bg-success text-success-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "critical":
        return "Crítico";
      case "monitoring":
        return "Monitoreo";
      case "stable":
        return "Estable";
      default:
        return status;
    }
  };

  return (
    <Layout userRole="doctor">
      <div className="space-y-6 max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestión de Pacientes</h1>
            <p className="text-muted-foreground mt-1">Administra y consulta información de pacientes</p>
          </div>
          
          <Button className="bg-gradient-primary hover:opacity-90">
            <Plus className="h-5 w-5 mr-2" />
            Nuevo Paciente
          </Button>
        </div>

        {/* Filters & Search */}
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre o documento..."
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Patients Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Pacientes</CardTitle>
            <CardDescription>
              {patients.length} pacientes registrados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Documento</TableHead>
                    <TableHead>Edad</TableHead>
                    <TableHead>Tipo Sangre</TableHead>
                    <TableHead>Alergias</TableHead>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-accent/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-semibold">
                            {patient.avatar}
                          </div>
                          <span className="font-medium">{patient.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {patient.document}
                      </TableCell>
                      <TableCell>{patient.age} años</TableCell>
                      <TableCell>
                        <Badge variant="outline">{patient.bloodType}</Badge>
                      </TableCell>
                      <TableCell>
                        {patient.allergies.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {patient.allergies.map((allergy, idx) => (
                              <Badge 
                                key={idx} 
                                variant="outline" 
                                className="bg-warning/10 text-warning border-warning/20"
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">Ninguna</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{patient.hospital}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(patient.status)}>
                          {getStatusText(patient.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
