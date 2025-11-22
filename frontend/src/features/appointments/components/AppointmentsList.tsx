import { useState } from "react";
import { type Appointment } from "@/lib/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const statusOptions = [
    { value: "Completed", label: "Realizada" },
    { value: "Scheduled", label: "Programada" },
    { value: "Cancelled", label: "Cancelada" },
] as const;

const statusLabels = statusOptions.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
}, {});

function formatDisplayDate(value: string) {
    const [rawDate] = value.split("T");
    const [year, month, day] = rawDate.split("-").map((part) => Number.parseInt(part, 10));
    const localDate = new Date(year, (month ?? 1) - 1, day ?? 1);
    return new Intl.DateTimeFormat("es-AR", { dateStyle: "medium" }).format(localDate);
}

interface AppointmentsListProps {
    appointments: Appointment[];
    onStatusChange: (appointment: Appointment, status: Appointment["status"]) => void;
    updatingId: number | null;
}

export function AppointmentsList({ appointments, onStatusChange, updatingId }: AppointmentsListProps) {
    const [pendingStatusChange, setPendingStatusChange] = useState<{
        appointment: Appointment;
        status: Appointment["status"];
    } | null>(null);

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
        await onStatusChange(pendingStatusChange.appointment, pendingStatusChange.status);
        setPendingStatusChange(null);
    }

    return (
        <>
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
