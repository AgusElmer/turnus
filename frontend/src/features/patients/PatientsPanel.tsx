import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { usePatients } from "./hooks/usePatients";
import { useInsurances } from "./hooks/useInsurances";
import { PatientsList } from "./components/PatientsList";
import { PatientForm } from "./components/PatientForm";
import { type Patient } from "@/lib/api";
import { Button } from "@/components/ui/button";

export function PatientsPanel() {
    const { patients, loading: loadingPatients, error: patientsError, createPatient, updatePatient, reload: reloadPatients } = usePatients();
    const { insurances, loading: loadingInsurances, error: insurancesError } = useInsurances();
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [saving, setSaving] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [showSuccessAlert, setShowSuccessAlert] = useState(false);

    const handleEdit = (patient: Patient) => {
        setEditingPatient(patient);
    };

    const handleCancelEdit = () => {
        setEditingPatient(null);
    };

    const handleSubmit = async (data: any) => {
        setSaving(true);
        try {
            const payload = {
                ...data,
                insuranceProviderId: data.insuranceProviderId ? Number(data.insuranceProviderId) : null,
            };
            if (editingPatient) {
                await updatePatient(editingPatient.id, { ...payload, isActive: editingPatient.isActive });
                setShowSuccessAlert(true);
                setTimeout(() => setShowSuccessAlert(false), 3000);
            } else {
                await createPatient(payload);
            }
            setEditingPatient(null);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleStatus = async (patient: Patient) => {
        setUpdatingId(patient.id);
        try {
            await updatePatient(patient.id, {
                ...patient,
                insuranceProviderId: patient.insuranceProviderId,
                isActive: !patient.isActive,
            });
        } finally {
            setUpdatingId(null);
        }
    };

    const error = patientsError || insurancesError;
    const loading = loadingPatients || loadingInsurances;

    return (
        <div className="grid gap-6 lg:grid-cols-2">
            <Card>
                <CardHeader>
                    <CardTitle>{editingPatient ? "Editar paciente" : "Nuevo paciente"}</CardTitle>
                    <CardDescription>Completa los datos básicos para agendar rápidamente.</CardDescription>
                </CardHeader>
                <CardContent>
                    <PatientForm
                        insurances={insurances}
                        editingPatient={editingPatient}
                        onSubmit={handleSubmit}
                        onCancelEdit={handleCancelEdit}
                        saving={saving}
                        error={error}
                        showSuccessAlert={showSuccessAlert}
                    />
                </CardContent>
            </Card>

            <Card className="overflow-x-auto">
                <CardHeader>
                    <CardTitle>Pacientes registrados</CardTitle>
                    <div className="flex justify-between items-center">
                        <CardDescription>Últimos pacientes dados de alta en el sistema.</CardDescription>
                        <Button type="button" variant="ghost" onClick={reloadPatients} disabled={loading}>
                            Actualizar lista
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p className="text-sm text-muted-foreground">Cargando...</p>
                    ) : (
                        <PatientsList
                            patients={patients}
                            onEdit={handleEdit}
                            onToggleStatus={handleToggleStatus}
                            updatingId={updatingId}
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}