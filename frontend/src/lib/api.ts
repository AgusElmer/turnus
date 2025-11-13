export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export interface Patient {
  id: number;
  firstName: string;
  lastName: string;
  fullName: string;
  dni: string;
  isActive: boolean;
  insuranceProviderId: number | null;
  insuranceProviderName: string | null;
  phoneNumber?: string | null;
  email?: string | null;
}

export interface Practice {
  id: number;
  name: string;
  billingCode: string;
  description?: string | null;
  defaultPrice: number;
  isActive: boolean;
}

export interface InsuranceProvider {
  id: number;
  name: string;
  billingCode?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  isActive: boolean;
}

export interface Appointment {
  id: number;
  serviceDate: string;
  status: "Scheduled" | "Completed" | "Cancelled";
  customPrice?: number | null;
  amount: number;
  notes?: string | null;
  patientId: number;
  patientName: string;
  practiceId: number;
  practiceName: string;
  insuranceProviderId: number | null;
  insuranceProviderName: string | null;
}

export interface BillingPracticeBreakdownDto {
  practiceId: number;
  practiceName: string;
  quantity: number;
  amount: number;
}

export interface BillingProviderSummaryDto {
  insuranceProviderId: number;
  insuranceProviderName: string;
  totalAmount: number;
  practices: BillingPracticeBreakdownDto[];
}

export interface BillingSummaryDto {
  year: number;
  month: number;
  providers: BillingProviderSummaryDto[];
  totalAmount: number;
}

export const api = {
  getPatients: () => request<Patient[]>("/api/patients"),
  createPatient: (payload: Partial<Patient> & { dni: string }) =>
    request<Patient>("/api/patients", { method: "POST", body: JSON.stringify(payload) }),
  updatePatient: (id: number, payload: Partial<Patient>) =>
    request<Patient>(`/api/patients/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getPractices: () => request<Practice[]>("/api/practices"),
  createPractice: (payload: Partial<Practice>) =>
    request<Practice>("/api/practices", { method: "POST", body: JSON.stringify(payload) }),
  updatePractice: (id: number, payload: Partial<Practice>) =>
    request<Practice>(`/api/practices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getInsurances: () => request<InsuranceProvider[]>("/api/insuranceproviders"),
  createInsurance: (payload: Partial<InsuranceProvider>) =>
    request<InsuranceProvider>("/api/insuranceproviders", { method: "POST", body: JSON.stringify(payload) }),
  updateInsurance: (id: number, payload: Partial<InsuranceProvider>) =>
    request<InsuranceProvider>(`/api/insuranceproviders/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getAppointments: (query: URLSearchParams) => request<Appointment[]>(`/api/appointments?${query.toString()}`),
  createAppointment: (payload: Record<string, unknown>) =>
    request<Appointment>("/api/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: number, payload: Record<string, unknown>) =>
    request<Appointment>(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getBillingSummary: (year: number, month: number) =>
    request<BillingSummaryDto>(`/api/billing/monthly?year=${year}&month=${month}`),
};
