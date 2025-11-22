import { useState, useEffect, useCallback } from "react";
import { api, type Practice } from "@/lib/api";

export function usePractices() {
    const [practices, setPractices] = useState<Practice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadPractices = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.getPractices();
            setPractices(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la lista de prácticas");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPractices();
    }, [loadPractices]);

    const createPractice = useCallback(async (payload: Parameters<typeof api.createPractice>[0]) => {
        try {
            const created = await api.createPractice(payload);
            setPractices((prev) => [created, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar la práctica");
            throw err;
        }
    }, []);

    const updatePractice = useCallback(async (id: number, payload: Parameters<typeof api.updatePractice>[1]) => {
        try {
            const updated = await api.updatePractice(id, payload);
            setPractices((prev) => prev.map((p) => (p.id === id ? updated : p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar la práctica");
            throw err;
        }
    }, []);

    const updatePracticePrices = useCallback(async (id: number, payload: Parameters<typeof api.updatePracticePrices>[1]) => {
        try {
            const updatedPrices = await api.updatePracticePrices(id, payload);
            const particularPrice = updatedPrices.find((price) => price.insuranceProviderId == null)?.price ?? 0;
            setPractices((prev) => prev.map((p) => (p.id === id ? { ...p, prices: updatedPrices, defaultPrice: particularPrice || p.defaultPrice } : p)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al actualizar los precios");
            throw err;
        }
    }, []);

    return { practices, loading, error, createPractice, updatePractice, updatePracticePrices, reload: loadPractices };
}
