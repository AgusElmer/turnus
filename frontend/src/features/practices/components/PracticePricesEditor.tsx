import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert } from "@/components/ui/alert";
import { type Practice, type InsuranceProvider } from "@/lib/api";
import { useEffect, useState } from "react";

interface PricesFormInputs {
    [key: string]: string;
}

interface PracticePricesEditorProps {
    practices: Practice[];
    insurances: InsuranceProvider[];
    onSavePrices: (practiceId: number, data: PricesFormInputs) => Promise<void>;
    saving: boolean;
    error: string | null;
}

export function PracticePricesEditor({ practices, insurances, onSavePrices, saving, error }: PracticePricesEditorProps) {
    const { register, handleSubmit, reset } = useForm<PricesFormInputs>();
    const [selectedPracticeId, setSelectedPracticeId] = useState<string>("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const selectedPractice = practices.find((p) => p.id.toString() === selectedPracticeId);

    useEffect(() => {
        if (selectedPractice) {
            const values: PricesFormInputs = {};
            const priceMap = new Map<string, string>();
            selectedPractice.prices.forEach((price) => {
                const key = price.insuranceProviderId == null ? "particular" : price.insuranceProviderId.toString();
                priceMap.set(key, price.price.toString());
            });

            values.particular = priceMap.get("particular") ?? selectedPractice.defaultPrice.toString();
            insurances.forEach((insurance) => {
                const key = insurance.id.toString();
                values[key] = priceMap.get(key) ?? selectedPractice.defaultPrice.toString();
            });
            reset(values);
        } else {
            reset({});
        }
    }, [selectedPractice, insurances, reset]);

    const handleFormSubmit: SubmitHandler<PricesFormInputs> = async (data) => {
        await onSavePrices(Number(selectedPracticeId), data);
        setSuccessMessage("Valores actualizados correctamente");
        setTimeout(() => setSuccessMessage(null), 3000);
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            <div className="space-y-2">
                <Label htmlFor="pricePractice">Práctica</Label>
                <select
                    id="pricePractice"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={selectedPracticeId}
                    onChange={(event) => setSelectedPracticeId(event.target.value)}
                    required
                >
                    <option value="">Selecciona una práctica</option>
                    {practices.map((practice) => (
                        <option key={practice.id} value={practice.id}>
                            {practice.name} ({practice.billingCode})
                        </option>
                    ))}
                </select>
            </div>
            {selectedPractice ? (
                <div className="space-y-4">
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Obra social</TableHead>
                                <TableHead className="text-right">Valor ($)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            <TableRow>
                                <TableCell className="font-medium">Particular</TableCell>
                                <TableCell className="text-right">
                                    <Input
                                        type="number"
                                        min="0"
                                        step="100"
                                        required
                                        {...register("particular")}
                                    />
                                </TableCell>
                            </TableRow>
                            {insurances.map((insurance) => (
                                <TableRow key={insurance.id}>
                                    <TableCell className="font-medium">{insurance.name}</TableCell>
                                    <TableCell className="text-right">
                                        <Input
                                            type="number"
                                            min="0"
                                            step="100"
                                            required
                                            {...register(insurance.id.toString())}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    <div className="flex items-center gap-3">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Guardando..." : "Guardar valores"}
                        </Button>
                    </div>
                </div>
            ) : (
                <p className="text-sm text-muted-foreground">Selecciona una práctica para editar sus valores.</p>
            )}
        </form>
    );
}
