import { Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Pacientes from "./pages/Pacientes";
import PacienteProfile from "./pages/PacienteProfile";
import Emergencias from "./pages/Emergencias";
import EmergenciaForm from "./pages/EmergenciaForm";
import EmergenciaDetail from "./pages/EmergenciaDetail";
import Monitoring from "./pages/Monitoring";
import AdminUsers from "./pages/AdminUsers";
import AdminHospitals from "./pages/AdminHospitals";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Cargando...</div>}>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Pacientes Routes */}
            <Route
              path="/pacientes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Pacientes />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/pacientes/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PacienteProfile />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Emergencias Routes */}
            <Route
              path="/emergencias"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Emergencias />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergencias/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmergenciaForm />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergencias/:id"
              element={
                <ProtectedRoute>
                  <Layout>
                    <EmergenciaDetail />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Monitoreo */}
            <Route
              path="/monitoreo"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Monitoring />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            {/* Admin Routes */}
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminUsers />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hospitals"
              element={
                <ProtectedRoute requireAdmin>
                  <Layout>
                    <AdminHospitals />
                  </Layout>
                </ProtectedRoute>
              }
            />
            
            <Route path="/404" element={<NotFound />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
          <Toaster />
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
