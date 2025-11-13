import { useEffect, useState } from "react";
import { api, type InsuranceProvider, type Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const emptyForm = {
  firstName: "",
  lastName: "",
  dni: "",
  insuranceProviderId: "",
  phoneNumber: "",
  email: "",
};

export function PatientsPanel() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ patient: Patient; nextState: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const [patientsData, insuranceData] = await Promise.all([api.getPatients(), api.getInsurances()]);
      setPatients(patientsData);
      setInsurances(insuranceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los pacientes");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.firstName || !form.lastName || !form.dni) return;

    try {
      setSaving(true);
      setError(null);
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dni: form.dni,
        phoneNumber: form.phoneNumber || undefined,
        email: form.email || undefined,
        insuranceProviderId: form.insuranceProviderId ? Number(form.insuranceProviderId) : null,
      };
      const created = await api.createPatient(payload);
      setPatients((prev) => [created, ...prev]);
      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el paciente");
    } finally {
      setSaving(false);
    }
  }

  function requestToggle(patient: Patient) {
    setPendingToggle({ patient, nextState: !patient.isActive });
  }

  async function applyToggleStatus(patient: Patient, nextState: boolean) {
    try {
      setUpdatingId(patient.id);
      setError(null);
      const payload = {
        firstName: patient.firstName,
        lastName: patient.lastName,
        dni: patient.dni,
        phoneNumber: patient.phoneNumber ?? undefined,
        email: patient.email ?? undefined,
        insuranceProviderId: patient.insuranceProviderId,
        isActive: nextState,
      };
      const updated = await api.updatePatient(patient.id, payload);
      setPatients((prev) => prev.map((item) => (item.id === patient.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el estado");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleConfirmToggle() {
    if (!pendingToggle) return;
    await applyToggleStatus(pendingToggle.patient, pendingToggle.nextState);
    setPendingToggle(null);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nuevo paciente</CardTitle>
          <CardDescription>Completa los datos básicos para agendar rápidamente.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Nombre</Label>
                <Input
                  id="firstName"
                  value={form.firstName}
                  onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                  placeholder="Ana"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Apellido</Label>
                <Input
                  id="lastName"
                  value={form.lastName}
                  onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                  placeholder="Pérez"
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dni">DNI</Label>
                <Input
                  id="dni"
                  value={form.dni}
                  onChange={(event) => setForm({ ...form, dni: event.target.value })}
                  placeholder="30111222"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="insurance">Obra social</Label>
                <select
                  id="insurance"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.insuranceProviderId}
                  onChange={(event) => setForm({ ...form, insuranceProviderId: event.target.value })}
                >
                  <option value="">Particular</option>
                  {insurances.map((insurance) => (
                    <option key={insurance.id} value={insurance.id}>
                      {insurance.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.phoneNumber}
                  onChange={(event) => setForm({ ...form, phoneNumber: event.target.value })}
                  placeholder="11 5555 6666"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  placeholder="paciente@email.com"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar paciente"}
              </Button>
              <Button type="button" variant="ghost" onClick={loadData} disabled={loading}>
                Actualizar lista
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Pacientes registrados</CardTitle>
          <CardDescription>Últimos pacientes dados de alta en el sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>DNI</TableHead>
                  <TableHead>Obra social</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell className="font-medium">{patient.fullName}</TableCell>
                    <TableCell>{patient.dni}</TableCell>
                    <TableCell>{patient.insuranceProviderName ?? "Particular"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {patient.phoneNumber && <span>{patient.phoneNumber}</span>}
                        {patient.email && <span className="text-xs text-muted-foreground">{patient.email}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="space-y-2 text-right">
                      <Badge variant={patient.isActive ? "success" : "secondary"}>
                        {patient.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestToggle(patient)}
                        disabled={updatingId === patient.id}
                      >
                        {patient.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
      <ConfirmDialog
        open={pendingToggle !== null}
        title="Confirmar cambio de estado"
        description={
          pendingToggle
            ? `¿Deseas ${pendingToggle.nextState ? "activar" : "desactivar"} a ${pendingToggle.patient.fullName}?`
            : undefined
        }
        confirmLabel="Sí"
        cancelLabel="Cancelar"
        onConfirm={() => {
          void handleConfirmToggle();
        }}
        onCancel={() => setPendingToggle(null)}
      />
    </>
  );
}
