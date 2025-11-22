import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { type InsuranceProvider, type Patient } from "@/lib/api";
import { useEffect } from "react";

interface PatientFormInputs {
    firstName: string;
    lastName: string;
    dni: string;
    insuranceProviderId: string;
    phoneNumber: string;
    email: string;
}

interface PatientFormProps {
    insurances: InsuranceProvider[];
    editingPatient: Patient | null;
    onSubmit: (data: PatientFormInputs) => Promise<void>;
    onCancelEdit: () => void;
    saving: boolean;
    error: string | null;
    showSuccessAlert: boolean;
}

export function PatientForm({
    insurances,
    editingPatient,
    onSubmit,
    onCancelEdit,
    saving,
    error,
    showSuccessAlert,
}: PatientFormProps) {
    const { register, handleSubmit, reset } = useForm<PatientFormInputs>();

    useEffect(() => {
        if (editingPatient) {
            reset({
                firstName: editingPatient.firstName,
                lastName: editingPatient.lastName,
                dni: editingPatient.dni,
                insuranceProviderId: editingPatient.insuranceProviderId?.toString() ?? "",
                phoneNumber: editingPatient.phoneNumber ?? "",
                email: editingPatient.email ?? "",
            });
        } else {
            reset({
                firstName: "",
                lastName: "",
                dni: "",
                insuranceProviderId: "",
                phoneNumber: "",
                email: "",
            });
        }
    }, [editingPatient, reset]);

    const handleFormSubmit: SubmitHandler<PatientFormInputs> = async (data) => {
        await onSubmit(data);
    };

    return (
        <>
            {showSuccessAlert && (
                <Alert variant="success" className="mb-4">
                    Paciente actualizado correctamente.
                </Alert>
            )}
            <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">Nombre</Label>
                        <Input
                            id="firstName"
                            {...register("firstName", { required: true })}
                            placeholder="Ana"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Apellido</Label>
                        <Input
                            id="lastName"
                            {...register("lastName", { required: true })}
                            placeholder="Pérez"
                        />
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="dni">DNI</Label>
                        <Input
                            id="dni"
                            {...register("dni", { required: true })}
                            placeholder="30111222"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="insurance">Obra social</Label>
                        <select
                            id="insurance"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            {...register("insuranceProviderId")}
                        >
                            <option value="">Particular</option>
                            {insurances.map((insurance) => (
                                <option key={insurance.id} value={insurance.id}>
                                    {insurance.name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                            id="phone"
                            {...register("phoneNumber")}
                            placeholder="11 5555 6666"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            {...register("email")}
                            placeholder="paciente@email.com"
                        />
                    </div>
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
                <div className="flex items-center gap-3">
                    <Button type="submit" disabled={saving}>
                        {saving ? "Guardando..." : editingPatient ? "Guardar cambios" : "Guardar paciente"}
                    </Button>
                    {editingPatient && (
                        <Button type="button" variant="ghost" onClick={onCancelEdit}>
                            Cancelar
                        </Button>
                    )}
                </div>
            </form>
        </>
    );
}
