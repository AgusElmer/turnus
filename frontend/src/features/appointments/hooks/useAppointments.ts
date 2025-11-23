import { useState, useEffect, useCallback } from "react";
import { api, type Appointment } from "@/lib/api";

export function useAppointments(initialFilters: { from: string; to: string; insuranceProviderId: string }) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.from) params.append("from", filters.from);
            if (filters.to) params.append("to", filters.to);
            if (filters.insuranceProviderId) params.append("insuranceProviderId", filters.insuranceProviderId);
            const response = await api.getAppointments(params);
            setAppointments(response);
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la agenda");
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadAppointments();
    }, [loadAppointments]);

    const createAppointment = useCallback(async (payload: Omit<Parameters<typeof api.createAppointment>[0], "usePatientInsurance"> & { usePatientInsurance?: boolean }) => {
        try {
            const finalPayload = {
                ...payload,
                usePatientInsurance: payload.usePatientInsurance ?? payload.insuranceProviderId !== "particular",
            };
            const created = await api.createAppointment(finalPayload);
            setAppointments((prev) => [created, ...prev]);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar el turno");
            throw err;
        }
    }, []);

    const updateAppointmentStatus = useCallback(async (appointment: Appointment, status: Appointment["status"]) => {
        try {
            const payload = {
                serviceDate: appointment.serviceDate.split("T")[0],
                status,
                insuranceProviderId: appointment.insuranceProviderId ?? undefined,
                customPrice: appointment.customPrice ?? undefined,
                notes: appointment.notes ?? undefined,
            };
            const updated = await api.updateAppointment(appointment.id, payload);
            setAppointments((prev) => prev.map((item) => (item.id === appointment.id ? updated : item)));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el turno");
            throw err;
        }
    }, []);

    return { appointments, loading, error, filters, setFilters, createAppointment, updateAppointmentStatus };
}
