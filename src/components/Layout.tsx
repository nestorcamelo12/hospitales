import { ReactNode, useState, useEffect } from "react";
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
import { useAuth } from "@/contexts/AuthContext";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  // Sidebar cerrado por defecto en móviles, abierto en desktop
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user } = useAuth();

  // Detectar tamaño de pantalla
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // En desktop, abrir sidebar por defecto
      if (!mobile) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

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
      {/* Overlay para móviles */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-sidebar border-r border-sidebar-border transition-all duration-300 ${
          isMobile 
            ? (sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full")
            : (sidebarOpen ? "w-64" : "w-20")
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
      <div className={`transition-all duration-300 ${
        isMobile ? "ml-0" : (sidebarOpen ? "ml-64" : "ml-20")
      }`}>
        {/* Header para móviles */}
        {isMobile && (
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden"
            >
              <Menu className="h-6 w-6" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold">UNIPAZ</span>
            </div>
          </header>
        )}
        
        <main className={`min-h-screen p-4 md:p-6 ${isMobile ? 'pt-4' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
