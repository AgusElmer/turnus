import { useState } from "react";
import { type InsuranceProvider } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface InsuranceProvidersListProps {
    providers: InsuranceProvider[];
    onToggleStatus: (provider: InsuranceProvider) => void;
    updatingId: number | null;
}

export function InsuranceProvidersList({ providers, onToggleStatus, updatingId }: InsuranceProvidersListProps) {
    const [pendingToggle, setPendingToggle] = useState<InsuranceProvider | null>(null);

    function requestToggle(provider: InsuranceProvider) {
        setPendingToggle(provider);
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
                        <TableHead>Contacto</TableHead>
                        <TableHead className="text-right">Estado</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {providers.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell>{item.billingCode ?? "-"}</TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    {item.contactEmail && <span>{item.contactEmail}</span>}
                                    {item.contactPhone && (
                                        <span className="text-xs text-muted-foreground">{item.contactPhone}</span>
                                    )}
                                </div>
                            </TableCell>
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
                        ? `¿Deseas ${!pendingToggle.isActive ? "activar" : "desactivar"} la obra social ${pendingToggle.name}?`
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
