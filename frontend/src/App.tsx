import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppointmentsPanel } from "@/features/appointments/AppointmentsPanel";
import { PatientsPanel } from "@/features/patients/PatientsPanel";
import { PracticesPanel } from "@/features/practices/PracticesPanel";
import { InsurancesPanel } from "@/features/insurances/InsurancesPanel";
import { BillingPanel } from "@/features/billing/BillingPanel";
import { useAuth } from "@/features/auth/AuthContext";
import { LoginScreen } from "@/features/auth/LoginScreen";
import { useTheme } from "@/features/theme/ThemeContext";

const sections = [
  { id: "agenda", label: "Agenda", description: "Turnos del día", component: AppointmentsPanel },
  { id: "pacientes", label: "Pacientes", description: "Altas y datos", component: PatientsPanel },
  { id: "practicas", label: "Prácticas", description: "Valores y códigos", component: PracticesPanel },
  { id: "obras", label: "Obras sociales", description: "Datos de facturación", component: InsurancesPanel },
  { id: "facturacion", label: "Facturación", description: "Resumen mensual", component: BillingPanel },
] as const;

export default function App() {
  const { user, isAuthenticated, loading, logout, authDisabled } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("agenda");
  const ActiveComponent = useMemo(() => sections.find((section) => section.id === activeSection)?.component ?? AppointmentsPanel, [activeSection]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-muted-foreground">Verificando sesión...</div>;
  }

  if (!isAuthenticated && !authDisabled) {
    return <LoginScreen />;
  }

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Consultorio de confianza</p>
            <h1 className="text-3xl font-semibold">Turnus</h1>
            <p className="text-muted-foreground">Organiza pacientes, prácticas y facturas en un solo lugar.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={section.id === activeSection ? "default" : "outline"}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={toggleTheme}>
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </Button>
            {user && (
              <div className="ml-2 flex items-center gap-3 rounded-full border px-3 py-1 text-sm">
                {user.picture && <img src={user.picture} alt={user.name} className="h-8 w-8 rounded-full" />}
                <div className="flex flex-col">
                  <span className="font-medium leading-tight">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Salir
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        <p className="text-sm text-muted-foreground">
          {sections.find((section) => section.id === activeSection)?.description}
        </p>
        <ActiveComponent />
      </main>
    </div>
  );
}
