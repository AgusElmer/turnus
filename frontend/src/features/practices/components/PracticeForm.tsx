import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PracticeFormInputs {
    name: string;
    billingCode: string;
    description: string;
    defaultPrice: string;
}

interface PracticeFormProps {
    onSubmit: (data: PracticeFormInputs) => Promise<void>;
    saving: boolean;
    error: string | null;
}

export function PracticeForm({ onSubmit, saving, error }: PracticeFormProps) {
    const { register, handleSubmit, reset } = useForm<PracticeFormInputs>({
        defaultValues: {
            name: "",
            billingCode: "",
            description: "",
            defaultPrice: "",
        },
    });

    const handleFormSubmit: SubmitHandler<PracticeFormInputs> = async (data) => {
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
                    placeholder="Ecografía"
                />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                    <Label htmlFor="code">Código</Label>
                    <Input
                        id="code"
                        {...register("billingCode", { required: true })}
                        placeholder="ECO01"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="price">Valor base ($)</Label>
                    <Input
                        id="price"
                        type="number"
                        min="0"
                        step="100"
                        {...register("defaultPrice", { required: true })}
                        placeholder="8000"
                    />
                </div>
            </div>
            <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Textarea
                    id="description"
                    rows={3}
                    {...register("description")}
                    placeholder="Detalles útiles para el equipo"
                />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                    {saving ? "Guardando..." : "Guardar práctica"}
                </Button>
            </div>
        </form>
    );
}
