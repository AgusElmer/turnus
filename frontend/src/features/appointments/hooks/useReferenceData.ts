import { useState, useEffect } from "react";
import { api, type Patient, type Practice, type InsuranceProvider } from "@/lib/api";

export function useReferenceData() {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [practices, setPractices] = useState<Practice[]>([]);
    const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const [patientsData, practicesData, insuranceData] = await Promise.all([
                    api.getPatients(),
                    api.getPractices(),
                    api.getInsurances(),
                ]);
                setPatients(patientsData);
                setPractices(practicesData);
                setInsurances(insuranceData);
            } catch (err) {
                setError(err instanceof Error ? err.message : "No se pudieron cargar los datos de referencia");
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    return { patients, practices, insurances, loading, error };
}
