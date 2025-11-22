import { useState, useEffect, useCallback } from "react";
import { api, type InsuranceProvider } from "@/lib/api";

export function useInsurances() {
    const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadInsurances = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getInsurances();
            setInsurances(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la lista de obras sociales");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInsurances();
    }, [loadInsurances]);

    const createInsurance = useCallback(async (payload: Parameters<typeof api.createInsurance>[0]) => {
        try {
            const created = await api.createInsurance(payload);
            setInsurances((prev) => [created, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar la obra social");
            throw err;
        }
    }, []);

    const updateInsurance = useCallback(async (id: number, payload: Parameters<typeof api.updateInsurance>[1]) => {
        try {
            const updated = await api.updateInsurance(id, payload);
            setInsurances((prev) => prev.map((p) => (p.id === id ? updated : p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar la obra social");
            throw err;
        }
    }, []);

    return { insurances, loading, error, createInsurance, updateInsurance, reload: loadInsurances };
}
