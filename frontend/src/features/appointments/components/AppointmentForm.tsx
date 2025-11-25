import { useForm, type SubmitHandler } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type Patient, type Practice, type InsuranceProvider } from "@/lib/api";

const today = new Date().toISOString().split("T")[0];
const particularOptionValue = "particular";
const defaultDurationMinutes = 15;
const slotStepSeconds = defaultDurationMinutes * 60;

function getRoundedCurrentTime() {
    const now = new Date();
    now.setSeconds(0, 0);

    const remainder = now.getMinutes() % defaultDurationMinutes;
    if (remainder > 0) {
        now.setMinutes(now.getMinutes() + (defaultDurationMinutes - remainder));
    }

    return now.toTimeString().slice(0, 5);
}

interface AppointmentFormInputs {
    patientId: string;
    practiceId: string;
    insuranceProviderId: string;
    serviceDate: string;
    serviceTime: string;
    status: "Completed" | "Scheduled" | "Cancelled";
    customPrice: string;
    notes: string;
}

interface AppointmentFormProps {
    patients: Patient[];
    practices: Practice[];
    insurances: InsuranceProvider[];
    onSubmit: (data: AppointmentFormInputs) => Promise<void>;
    saving: boolean;
    error: string | null;
}

export function AppointmentForm({ patients, practices, insurances, onSubmit, saving, error }: AppointmentFormProps) {
    const { register, handleSubmit, reset } = useForm<AppointmentFormInputs>({
        defaultValues: {
            patientId: "",
            practiceId: "",
            insuranceProviderId: "",
            serviceDate: today,
            serviceTime: getRoundedCurrentTime(),
            status: "Completed",
            customPrice: "",
            notes: "",
        },
    });

    const handleFormSubmit: SubmitHandler<AppointmentFormInputs> = async (data) => {
        await onSubmit(data);
        reset({ ...data, notes: "", customPrice: "", status: "Completed" });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Agendar turno</CardTitle>
                <CardDescription>Registra consultas y prácticas en segundos.</CardDescription>
            </CardHeader>
            <CardContent>
                <form className="space-y-4" onSubmit={handleSubmit(handleFormSubmit)}>
                    <div className="space-y-2">
                        <Label htmlFor="patientId">Paciente</Label>
                        <select
                            id="patientId"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            {...register("patientId", { required: true })}
                        >
                            <option value="">Selecciona un paciente</option>
                            {patients.map((patient) => (
                                <option key={patient.id} value={patient.id}>
                                    {patient.fullName} - {patient.dni}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="practiceId">Práctica</Label>
                            <select
                                id="practiceId"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                {...register("practiceId", { required: true })}
                            >
                                <option value="">Selecciona una práctica</option>
                                {practices.map((practice) => (
                                    <option key={practice.id} value={practice.id}>
                                        {practice.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceDate">Fecha</Label>
                            <Input
                                id="serviceDate"
                                type="date"
                                {...register("serviceDate", { required: true })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="serviceTime">Hora</Label>
                            <Input
                                id="serviceTime"
                                type="time"
                                step={slotStepSeconds}
                                {...register("serviceTime", { required: true })}
                            />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="insuranceProviderId">Obra social</Label>
                            <select
                                id="insuranceProviderId"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                {...register("insuranceProviderId")}
                            >
                                <option value="">Usar la del paciente</option>
                                <option value={particularOptionValue}>Particular (sin obra social)</option>
                                {insurances.map((insurance) => (
                                    <option key={insurance.id} value={insurance.id}>
                                        {insurance.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Estado</Label>
                            <select
                                id="status"
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                {...register("status")}
                            >
                                <option value="Scheduled">Programada</option>
                                <option value="Completed">Realizada</option>
                                <option value="Cancelled">Cancelada</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="customPrice">Precio personalizado ($)</Label>
                        <Input
                            id="customPrice"
                            type="number"
                            min="0"
                            step="100"
                            {...register("customPrice")}
                            placeholder="Usar valor de la práctica"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="notes">Notas</Label>
                        <Textarea
                            id="notes"
                            rows={3}
                            {...register("notes")}
                            placeholder="Observaciones para el día"
                        />
                    </div>
                    {error && <p className="text-sm text-destructive">{error}</p>}
                    <Button type="submit" disabled={saving}>
                        {saving ? "Guardando..." : "Agregar a la agenda"}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
