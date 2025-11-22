import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePractices } from "./hooks/usePractices";
import { useInsurances } from "../patients/hooks/useInsurances";
import { PracticesList } from "./components/PracticesList";
import { PracticeForm } from "./components/PracticeForm";
import { PracticePricesEditor } from "./components/PracticePricesEditor";
import { type Practice } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function PracticesPanel() {
    const { practices, loading: loadingPractices, error: practicesError, createPractice, updatePractice, updatePracticePrices, reload: reloadPractices } = usePractices();
    const { insurances, loading: loadingInsurances, error: insurancesError } = useInsurances();
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleCreatePractice = async (data: any) => {
        setSaving(true);
        try {
            await createPractice({
                ...data,
                defaultPrice: Number(data.defaultPrice),
            });
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (practice: Practice) => {
        setUpdatingId(practice.id);
        try {
            await updatePractice(practice.id, {
                ...practice,
                isActive: !practice.isActive,
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const handleSavePrices = async (practiceId: number, data: any) => {
        setSaving(true);
        try {
            const payload = Object.entries(data).map(([key, value]) => ({
                insuranceProviderId: key === "particular" ? null : Number(key),
                price: Number(value),
            }));
            await updatePracticePrices(practiceId, payload);
        } finally {
            setSaving(false);
        }
    };

    const error = practicesError || insurancesError;
    const loading = loadingPractices || loadingInsurances;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>Nueva práctica</CardTitle>
                    <CardDescription>Define los códigos y valores a facturar.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PracticeForm
                        onSubmit={handleCreatePractice}
                        saving={saving}
                        error={error}
                    />
                </CardContent>
            </Card>

            <Card className="overflow-x-auto">
                <CardHeader>
                    <CardTitle>Listado de prácticas</CardTitle>
                    <div className="flex justify-between items-center">
                        <CardDescription>Valores de referencia vigentes.</CardDescription>
                        <Button type="button" variant="ghost" onClick={reloadPractices} disabled={loading}>
                            Actualizar
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : (
                        <PracticesList
                            practices={practices}
                            onToggleStatus={handleToggleStatus}
                            updatingId={updatingId}
                        />
                    )}
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Valores por obra social</CardTitle>
                    <CardDescription>Configura importes específicos para cada práctica e institución.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PracticePricesEditor
                        practices={practices}
                        insurances={insurances}
                        onSavePrices={handleSavePrices}
                        saving={saving}
                        error={error}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
