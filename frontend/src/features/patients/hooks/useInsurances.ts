import { useState, useEffect } from "react";
import { api, type InsuranceProvider } from "@/lib/api";

export function useInsurances() {
    const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const insuranceData = await api.getInsurances();
                setInsurances(insuranceData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudieron cargar las obras sociales");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return { insurances, loading, error };
}
