import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useReferenceData } from "./hooks/useReferenceData";
import { useAppointments } from "./hooks/useAppointments";
import { AppointmentForm } from "./components/AppointmentForm";
import { AppointmentFilters } from "./components/AppointmentFilters";
import { AppointmentsList } from "./components/AppointmentsList";

const today = new Date().toISOString().split("T")[0];

export function AppointmentsPanel() {
    const { patients, practices, insurances, loading: loadingReferenceData, error: referenceDataError } = useReferenceData();
    const { appointments, loading: loadingAppointments, error: appointmentsError, filters, setFilters, createAppointment, updateAppointmentStatus } = useAppointments({ from: today, to: today, insuranceProviderId: "" });
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);

    const handleCreateAppointment = async (data: any) => {
        setSaving(true);
        try {
            const isParticular = data.insuranceProviderId === "particular";
            const selectedInsuranceId =
                data.insuranceProviderId === ""
                    ? undefined
                    : isParticular
                        ? null
                        : Number(data.insuranceProviderId);

            await createAppointment({
                ...data,
                patientId: Number(data.patientId),
                practiceId: Number(data.practiceId),
                insuranceProviderId: selectedInsuranceId,
                usePatientInsurance: !isParticular,
                customPrice: data.customPrice ? Number(data.customPrice) : undefined,
            });
        } finally {
            setSaving(false);
        }
    };

    const handleStatusChange = async (appointment: any, status: any) => {
        setUpdatingId(appointment.id);
        try {
            await updateAppointmentStatus(appointment, status);
        } finally {
            setUpdatingId(null);
        }
    };

    const error = referenceDataError || appointmentsError;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <AppointmentForm
                patients={patients}
                practices={practices}
                insurances={insurances}
                onSubmit={handleCreateAppointment}
                saving={saving}
                error={error}
            />

            <Card className="overflow-x-auto">
                <CardHeader>
                    <CardTitle>Agenda del consultorio</CardTitle>
                    <CardDescription>Filtra por fecha y obra social para ver rápidamente.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <AppointmentFilters
                        filters={filters}
                        onFiltersChange={setFilters}
                        insurances={insurances}
                    />

                    {loadingAppointments || loadingReferenceData ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : (
                        <AppointmentsList
                            appointments={appointments}
                            onStatusChange={handleStatusChange}
                            updatingId={updatingId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
