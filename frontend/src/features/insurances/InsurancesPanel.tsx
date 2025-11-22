import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInsurances } from "./hooks/useInsurances";
import { InsuranceProvidersList } from "./components/InsuranceProvidersList";
import { InsuranceProviderForm } from "./components/InsuranceProviderForm";
import { type InsuranceProvider } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function InsurancesPanel() {
    const { insurances, loading, error, createInsurance, updateInsurance, reload } = useInsurances();
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleCreate = async (data: any) => {
        setSaving(true);
        try {
            await createInsurance(data);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (provider: InsuranceProvider) => {
        setUpdatingId(provider.id);
        try {
            await updateInsurance(provider.id, {
                ...provider,
                isActive: !provider.isActive,
            });
        } finally {
            setUpdatingId(null);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva obra social</CardTitle>
                    <CardDescription>Registra cuentas a facturar y datos de contacto.</CardDescription>
                </CardHeader>
                <CardContent>
                    <InsuranceProviderForm
                        onSubmit={handleCreate}
                        saving={saving}
                        error={error}
                    />
                </CardContent>
            </Card>

            <Card className="overflow-x-auto">
                <CardHeader>
                    <CardTitle>Obras sociales registradas</CardTitle>
                    <div className="flex justify-between items-center">
                        <CardDescription>Información para consultar al facturar.</CardDescription>
                        <Button type="button" variant="ghost" onClick={reload} disabled={loading}>
                            Actualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : (
                        <InsuranceProvidersList
                            providers={insurances}
                            onToggleStatus={handleToggleStatus}
                            updatingId={updatingId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
