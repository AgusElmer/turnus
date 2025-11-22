import { useState, useEffect, useCallback } from "react";
import { api, type Patient } from "@/lib/api";

export function usePatients() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPatients = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getPatients();
            setPatients(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la lista de pacientes");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPatients();
    }, [loadPatients]);

    const createPatient = useCallback(async (payload: Parameters<typeof api.createPatient>[0]) => {
        try {
            const created = await api.createPatient(payload);
            setPatients((prev) => [created, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar el paciente");
            throw err;
        }
    }, []);

    const updatePatient = useCallback(async (id: number, payload: Parameters<typeof api.updatePatient>[1]) => {
        try {
            const updated = await api.updatePatient(id, payload);
            setPatients((prev) => prev.map((p) => (p.id === id ? updated : p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar el paciente");
            throw err;
        }
    }, []);
    
    const deletePatient = useCallback(async (id: number) => {
        try {
            await api.deletePatient(id);
            setPatients((prev) => prev.filter((p) => p.id !== id));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al eliminar el paciente");
            throw err;
        }
    }, []);

    return { patients, loading, error, createPatient, updatePatient, deletePatient, reload: loadPatients };
}
