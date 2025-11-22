import { useState, useEffect, useCallback } from "react";
import { api, type BillingSummaryDto } from "@/lib/api";

export function useBillingSummary(initialMonth: string) {
    const [summary, setSummary] = useState<BillingSummaryDto | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(initialMonth);

    const loadSummary = useCallback(async () => {
        if (!selectedMonth) return;
        const [year, month] = selectedMonth.split("-").map((value) => Number(value));

        try {
            setLoading(true);
            setError(null);
            const response = await api.getBillingSummary(year, month);
            setSummary(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo calcular la facturación");
        } finally {
            setLoading(false);
        }
    }, [selectedMonth]);

    useEffect(() => {
        void loadSummary();
    }, [loadSummary]);

    return { summary, loading, error, selectedMonth, setSelectedMonth };
}
