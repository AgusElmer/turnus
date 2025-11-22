import { useState } from "react";
import { type Practice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface PracticesListProps {
    practices: Practice[];
    onToggleStatus: (practice: Practice) => void;
    updatingId: number | null;
}

export function PracticesList({ practices, onToggleStatus, updatingId }: PracticesListProps) {
    const [pendingToggle, setPendingToggle] = useState<Practice | null>(null);

    function requestToggle(practice: Practice) {
        setPendingToggle(practice);
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
                        <TableHead>Código</TableHead>
                        <TableHead className="text-right">Precio</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {practices.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.billingCode}</TableCell>
                            <TableCell className="text-right">${item.defaultPrice.toLocaleString("es-AR")}</TableCell>
                            <TableCell className="space-y-2 text-right">
                                <Badge variant={item.isActive ? "success" : "secondary"}>
                                    {item.isActive ? "Activa" : "No disponible"}
                                </Badge>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => requestToggle(item)}
                                    disabled={updatingId === item.id}
                                >
                                    {item.isActive ? "Desactivar" : "Activar"}
                                </Button>
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
                        ? `¿Deseas ${!pendingToggle.isActive ? "activar" : "desactivar"} la práctica ${pendingToggle.name}?`
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
