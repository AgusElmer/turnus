import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { AppointmentsPanel } from "@/features/appointments/AppointmentsPanel";
import { PatientsPanel } from "@/features/patients/PatientsPanel";
import { PracticesPanel } from "@/features/practices/PracticesPanel";
import { InsurancesPanel } from "@/features/insurances/InsurancesPanel";
import { BillingPanel } from "@/features/billing/BillingPanel";

const sections = [
  { id: "agenda", label: "Agenda", description: "Turnos del día", component: AppointmentsPanel },
  { id: "pacientes", label: "Pacientes", description: "Altas y datos", component: PatientsPanel },
  { id: "practicas", label: "Prácticas", description: "Valores y códigos", component: PracticesPanel },
  { id: "obras", label: "Obras sociales", description: "Datos de facturación", component: InsurancesPanel },
  { id: "facturacion", label: "Facturación", description: "Resumen mensual", component: BillingPanel },
] as const;

export default function App() {
  const [activeSection, setActiveSection] = useState<(typeof sections)[number]["id"]>("agenda");
  const ActiveComponent = useMemo(() => sections.find((section) => section.id === activeSection)?.component ?? AppointmentsPanel, [activeSection]);

  return (
    <div className="min-h-screen bg-muted/20">
      <header className="border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Consultorio de confianza</p>
            <h1 className="text-3xl font-semibold">Turnus</h1>
            <p className="text-muted-foreground">Organiza pacientes, prácticas y facturas en un solo lugar.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {sections.map((section) => (
              <Button
                key={section.id}
                variant={section.id === activeSection ? "default" : "outline"}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </Button>
            ))}
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
