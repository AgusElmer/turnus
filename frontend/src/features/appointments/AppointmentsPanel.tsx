import { useEffect, useState } from "react";
import { api, type Appointment, type InsuranceProvider, type Patient, type Practice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

function toDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(value: string) {
  const [rawDate] = value.split("T");
  const [year, month, day] = rawDate.split("-").map((part) => Number.parseInt(part, 10));
  const localDate = new Date(year, (month ?? 1) - 1, day ?? 1);
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(localDate);
}

function normalizeDatePayload(value: string) {
  return value.split("T")[0];
}

const today = toDateInputValue(new Date());

const statusOptions = [
  { value: "Completed", label: "Realizada" },
  { value: "Scheduled", label: "Programada" },
  { value: "Cancelled", label: "Cancelada" },
] as const;

const statusLabels = statusOptions.reduce<Record<string, string>>((acc, option) => {
  acc[option.value] = option.label;
  return acc;
}, {});

export function AppointmentsPanel() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [practices, setPractices] = useState<Practice[]>([]);
  const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    appointment: Appointment;
    status: Appointment["status"];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ from: today, to: today, insuranceProviderId: "" });
  const particularOptionValue = "particular";

  const [form, setForm] = useState({
    patientId: "",
    practiceId: "",
    insuranceProviderId: "",
    serviceDate: today,
    status: "Completed",
    customPrice: "",
    notes: "",
  });

  useEffect(() => {
    refreshReferenceData();
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [filters.from, filters.to, filters.insuranceProviderId]);

  async function refreshReferenceData() {
    try {
      setLoading(true);
      const [patientsData, practicesData, insuranceData] = await Promise.all([
        api.getPatients(),
        api.getPractices(),
        api.getInsurances(),
      ]);
      setPatients(patientsData);
      setPractices(practicesData);
      setInsurances(insuranceData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar los datos");
    } finally {
      setLoading(false);
    }
  }

  async function loadAppointments() {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.from) params.append("from", filters.from);
      if (filters.to) params.append("to", filters.to);
      if (filters.insuranceProviderId) params.append("insuranceProviderId", filters.insuranceProviderId);
      const response = await api.getAppointments(params);
      setAppointments(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo cargar la agenda");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.patientId || !form.practiceId || !form.serviceDate) return;

    try {
      setSaving(true);
      setError(null);
      const usePatientInsurance = form.insuranceProviderId !== particularOptionValue;
      const insuranceProviderId =
        form.insuranceProviderId === "" || form.insuranceProviderId === particularOptionValue
          ? undefined
          : Number(form.insuranceProviderId);

      const payload = {
        patientId: Number(form.patientId),
        practiceId: Number(form.practiceId),
        serviceDate: form.serviceDate,
        status: form.status,
        notes: form.notes || undefined,
        insuranceProviderId,
        usePatientInsurance,
        customPrice: form.customPrice ? Number(form.customPrice) : undefined,
      };
      const created = await api.createAppointment(payload);
      setAppointments((prev) => [created, ...prev]);
      setForm((prev) => ({ ...prev, notes: "", customPrice: "", status: "Completed" }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar el turno");
    } finally {
      setSaving(false);
    }
  }

  async function applyStatusChange(appointment: Appointment, status: Appointment["status"]) {
    try {
      setUpdatingId(appointment.id);
      setError(null);
      const payload = {
        serviceDate: normalizeDatePayload(appointment.serviceDate),
        status,
        insuranceProviderId: appointment.insuranceProviderId ?? undefined,
        customPrice: appointment.customPrice ?? undefined,
        notes: appointment.notes ?? undefined,
      };
      const updated = await api.updateAppointment(appointment.id, payload);
      setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el turno");
    } finally {
      setUpdatingId(null);
    }
  }

  function handleSelectStatus(appointment: Appointment, status: Appointment["status"]) {
    if (status === appointment.status) {
      return;
    }

    setPendingStatusChange({ appointment, status });
  }

  async function confirmStatusChange() {
    if (!pendingStatusChange) {
      return;
    }

    await applyStatusChange(pendingStatusChange.appointment, pendingStatusChange.status);
    setPendingStatusChange(null);
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Agendar turno</CardTitle>
          <CardDescription>Registra consultas y prácticas en segundos.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente</Label>
              <select
                id="patientId"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.patientId}
                onChange={(event) => setForm({ ...form, patientId: event.target.value })}
                required
              >
                <option value="">Selecciona un paciente</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patient.fullName} - {patient.dni}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="practiceId">Práctica</Label>
                <select
                  id="practiceId"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.practiceId}
                  onChange={(event) => setForm({ ...form, practiceId: event.target.value })}
                  required
                >
                  <option value="">Selecciona una práctica</option>
                  {practices.map((practice) => (
                    <option key={practice.id} value={practice.id}>
                      {practice.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="serviceDate">Fecha</Label>
                <Input
                  id="serviceDate"
                  type="date"
                  value={form.serviceDate}
                  onChange={(event) => setForm({ ...form, serviceDate: event.target.value })}
                  required
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="insuranceProviderId">Obra social</Label>
                <select
                  id="insuranceProviderId"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.insuranceProviderId}
                  onChange={(event) => setForm({ ...form, insuranceProviderId: event.target.value })}
                >
                  <option value="">Usar la del paciente</option>
                  <option value={particularOptionValue}>Particular (sin obra social)</option>
                  {insurances.map((insurance) => (
                    <option key={insurance.id} value={insurance.id}>
                      {insurance.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <select
                  id="status"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                  value={form.status}
                  onChange={(event) => setForm({ ...form, status: event.target.value })}
                >
                  <option value="Scheduled">Programada</option>
                  <option value="Completed">Realizada</option>
                  <option value="Cancelled">Cancelada</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="customPrice">Precio personalizado ($)</Label>
              <Input
                id="customPrice"
                type="number"
                min="0"
                step="100"
                value={form.customPrice}
                onChange={(event) => setForm({ ...form, customPrice: event.target.value })}
                placeholder="Usar valor de la práctica"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(event) => setForm({ ...form, notes: event.target.value })}
                placeholder="Observaciones para el día"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Agregar a la agenda"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Agenda del consultorio</CardTitle>
          <CardDescription>Filtra por fecha y obra social para ver rápidamente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="from">Desde</Label>
              <Input id="from" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">Hasta</Label>
              <Input id="to" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="insuranceFilter">Obra social</Label>
              <select
                id="insuranceFilter"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={filters.insuranceProviderId}
                onChange={(event) => setFilters({ ...filters, insuranceProviderId: event.target.value })}
              >
                <option value="">Todas</option>
                {insurances.map((insurance) => (
                  <option key={insurance.id} value={insurance.id.toString()}>
                    {insurance.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Práctica</TableHead>
                  <TableHead>Obra social</TableHead>
                  <TableHead className="text-right">Importe</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment) => (
                  <TableRow key={appointment.id}>
                    <TableCell>{formatDisplayDate(appointment.serviceDate)}</TableCell>
                    <TableCell className="font-medium">{appointment.patientName}</TableCell>
                    <TableCell>{appointment.practiceName}</TableCell>
                    <TableCell>{appointment.insuranceProviderName ?? "Particular"}</TableCell>
                    <TableCell className="text-right">
                      <p className="font-medium">${appointment.amount.toLocaleString("es-AR")}</p>
                      {appointment.customPrice != null && (
                        <span className="text-xs text-muted-foreground">Personalizado</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={appointment.status === "Completed" ? "success" : appointment.status === "Cancelled" ? "destructive" : "secondary"}>
                          {statusLabels[appointment.status]}
                        </Badge>
                        <select
                          value={appointment.status}
                          onChange={(event) => handleSelectStatus(appointment, event.target.value as Appointment["status"])}
                          className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                          disabled={updatingId === appointment.id}
                        >
                          {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
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
        open={pendingStatusChange !== null}
        title="Confirmar cambio de estado"
        description={
          pendingStatusChange
            ? `¿Seguro que deseas marcar el turno de ${pendingStatusChange.appointment.patientName} como ${statusLabels[pendingStatusChange.status]}?`
            : undefined
        }
        confirmLabel="Sí, cambiar"
        cancelLabel="Cancelar"
        onConfirm={() => {
          void confirmStatusChange();
        }}
        onCancel={() => setPendingStatusChange(null)}
      />
    </>
  );
}
