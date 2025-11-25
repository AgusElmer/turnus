import { useState, useEffect, useCallback } from "react";
import { api, type Appointment } from "@/lib/api";

export function useAppointments(initialFilters: { from: string; to: string; insuranceProviderId: string }) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState(initialFilters);

    const parseDateOnly = useCallback((value: string) => {
        const [year, month, day] = value.split("-").map((part) => Number.parseInt(part, 10));
        return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1).getTime();
    }, []);

    const sortAppointmentsByDateTime = useCallback((items: Appointment[]) => {
        const parseDateTime = (appointment: Appointment) => {
            const [year, month, day] = appointment.serviceDate.split("T")[0]?.split("-").map((part) => Number.parseInt(part, 10));
            const [hours, minutes] = appointment.serviceTime.split(":").map((part) => Number.parseInt(part, 10));
            return new Date(year ?? 0, (month ?? 1) - 1, day ?? 1, hours ?? 0, minutes ?? 0).getTime();
        };

        return [...items].sort((a, b) => {
            const difference = parseDateTime(a) - parseDateTime(b);
            if (difference !== 0) return difference;
            return a.patientName.localeCompare(b.patientName);
        });
    }, []);

    const isWithinFilters = useCallback((appointment: Appointment) => {
        const dateOnly = appointment.serviceDate.split("T")[0];
        const appointmentDate = parseDateOnly(dateOnly);

        if (filters.from) {
            const fromDate = parseDateOnly(filters.from);
            if (appointmentDate < fromDate) return false;
        }

        if (filters.to) {
            const toDate = parseDateOnly(filters.to);
            if (appointmentDate > toDate) return false;
        }

        return true;
    }, [filters, parseDateOnly]);

    const loadAppointments = useCallback(async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            if (filters.from) params.append("from", filters.from);
            if (filters.to) params.append("to", filters.to);
            if (filters.insuranceProviderId) params.append("insuranceProviderId", filters.insuranceProviderId);
            const response = await api.getAppointments(params);
            setAppointments(sortAppointmentsByDateTime(response));
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo cargar la agenda");
        } finally {
            setLoading(false);
        }
    }, [filters, sortAppointmentsByDateTime]);

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
            setAppointments((prev) =>
                isWithinFilters(created) ? sortAppointmentsByDateTime([created, ...prev]) : prev
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error al guardar el turno");
            throw err;
        }
    }, [isWithinFilters, sortAppointmentsByDateTime]);

    const updateAppointmentStatus = useCallback(async (appointment: Appointment, status: Appointment["status"]) => {
        try {
            const normalizedTime = appointment.serviceTime.length === 5 ? `${appointment.serviceTime}:00` : appointment.serviceTime;
            const payload = {
                serviceDate: appointment.serviceDate.split("T")[0],
                serviceTime: normalizedTime,
                status,
                insuranceProviderId: appointment.insuranceProviderId ?? undefined,
                customPrice: appointment.customPrice ?? undefined,
                notes: appointment.notes ?? undefined,
            };
            const updated = await api.updateAppointment(appointment.id, payload);
            setAppointments((prev) =>
                sortAppointmentsByDateTime(prev.map((item) => (item.id === appointment.id ? updated : item)))
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : "No se pudo actualizar el turno");
            throw err;
        }
    }, [sortAppointmentsByDateTime]);

    return { appointments, loading, error, filters, setFilters, createAppointment, updateAppointmentStatus };
}
