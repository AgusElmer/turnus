import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InsuranceProviderFormInputs {
    name: string;
    billingCode: string;
    contactEmail: string;
    contactPhone: string;
    notes: string;
}

interface InsuranceProviderFormProps {
    onSubmit: (data: InsuranceProviderFormInputs) => Promise<void>;
    saving: boolean;
    error: string | null;
}

export function InsuranceProviderForm({ onSubmit, saving, error }: InsuranceProviderFormProps) {
    const { register, handleSubmit, reset } = useForm<InsuranceProviderFormInputs>({
        defaultValues: {
            name: "",
            billingCode: "",
            contactEmail: "",
            contactPhone: "",
            notes: "",
        },
    });

    const handleFormSubmit: SubmitHandler<InsuranceProviderFormInputs> = async (data) => {
        await onSubmit(data);
        reset();
    };

    return (
        <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
            <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input
                    id="name"
                    {...register("name", { required: true })}
                    placeholder="Swiss Medical"
                />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                        id="code"
                        {...register("billingCode")}
                        placeholder="SWISS"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                        id="phone"
                        {...register("contactPhone")}
                        placeholder="0800..."
                    />
                </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        {...register("contactEmail")}
                        placeholder="facturacion@obra.com"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notas</Label>
                    <Textarea
                        id="notes"
                        rows={3}
                        {...register("notes")}
                        placeholder="Datos útiles para la facturación"
                    />
                </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar"}
                </Button>
            </div>
        </form>
    );
}
