import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Activity, 
  AlertTriangle, 
  Settings,
  LogOut,
  Menu,
  X,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();

  // Mapear role_id a role string
  const getUserRole = (): "doctor" | "paramedic" | "admin" => {
    if (!user) return "doctor";
    switch (user.role_id) {
      case 1: return "admin";
      case 2: return "doctor";
      case 3: return "paramedic";
      default: return "doctor";
    }
  };

  const userRole = getUserRole();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["doctor", "paramedic", "admin"] },
    { name: "Pacientes", href: "/pacientes", icon: Users, roles: ["doctor", "admin"] },
    { name: "Emergencias", href: "/emergencias", icon: AlertTriangle, roles: ["doctor", "paramedic", "admin"] },
    { name: "Monitoreo", href: "/monitoreo", icon: Activity, roles: ["doctor", "admin"] },
    { name: "Usuarios", href: "/admin/users", icon: Settings, roles: ["admin"] },
    { name: "Hospitales", href: "/admin/hospitals", icon: Building2, roles: ["admin"] },
  ];

  const filteredNavigation = navigation.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background w-full">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
            {sidebarOpen && (
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                  <Activity className="h-5 w-5 text-white" />
                </div>
                <span className="text-lg font-semibold text-sidebar-foreground">UNIPAZ</span>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sidebar-foreground hover:bg-sidebar-accent"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-sidebar-primary text-sidebar-primary-foreground"
                      : "text-sidebar-foreground hover:bg-sidebar-accent"
                  }`}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-sidebar-border p-4">
            <Button
              variant="ghost"
              onClick={handleLogout}
              className={`w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent ${
                !sidebarOpen && "justify-center"
              }`}
            >
              <LogOut className="h-5 w-5 flex-shrink-0" />
              {sidebarOpen && <span className="ml-3">Cerrar Sesión</span>}
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarOpen ? "ml-64" : "ml-20"}`}>
        <main className="min-h-screen p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
