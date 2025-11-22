import { useState } from "react";
import { type Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface PatientsListProps {
    patients: Patient[];
    onEdit: (patient: Patient) => void;
    onToggleStatus: (patient: Patient) => void;
    updatingId: number | null;
}

export function PatientsList({ patients, onEdit, onToggleStatus, updatingId }: PatientsListProps) {
    const [pendingToggle, setPendingToggle] = useState<Patient | null>(null);

    function requestToggle(patient: Patient) {
        setPendingToggle(patient);
    }

    async function handleConfirmToggle() {
        if (!pendingToggle) return;
        onToggleStatus(pendingToggle);
        setPendingToggle(null);
    }

    return (
        <>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>DNI</TableHead>
                        <TableHead>Obra social</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
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
                            <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                    <Button size="sm" variant="outline" onClick={() => onEdit(patient)}>
                                        Editar
                                    </Button>
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
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            <ConfirmDialog
                open={pendingToggle !== null}
                title="Confirmar cambio de estado"
                description={
                    pendingToggle
                        ? `¿Deseas ${!pendingToggle.isActive ? "activar" : "desactivar"} a ${pendingToggle.fullName}?`
                        : undefined
                }
                confirmLabel="Sí"
                cancelLabel="Cancelar"
                onConfirm={handleConfirmToggle}
                onCancel={() => setPendingToggle(null)}
            />
        </>
    );
}
