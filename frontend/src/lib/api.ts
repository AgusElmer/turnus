export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

let authToken: string | null = null;
let unauthorizedHandler: (() => void) | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

function normalizeHeaders(input?: HeadersInit): Record<string, string> {
  if (!input) {
    return {};
  }

  if (input instanceof Headers) {
    return Object.fromEntries(input.entries());
  }

  if (Array.isArray(input)) {
    return Object.fromEntries(input);
  }

  return input;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...normalizeHeaders(init?.headers),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    if ((response.status === 401 || response.status === 403) && unauthorizedHandler) {
      unauthorizedHandler();
    }

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
  prices: PracticePrice[];
}

export interface PracticePrice {
  id: number;
  practiceId: number;
  insuranceProviderId: number | null;
  insuranceProviderName: string | null;
  price: number;
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
  deletePatient: (id: number) => request<void>(`/api/patients/${id}`, { method: "DELETE" }),

  getPractices: () => request<Practice[]>("/api/practices"),
  createPractice: (payload: Partial<Practice>) =>
    request<Practice>("/api/practices", { method: "POST", body: JSON.stringify(payload) }),
  updatePractice: (id: number, payload: Partial<Practice>) =>
    request<Practice>(`/api/practices/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deletePractice: (id: number) => request<void>(`/api/practices/${id}`, { method: "DELETE" }),
  updatePracticePrices: (id: number, payload: { insuranceProviderId: number | null; price: number }[]) =>
    request<PracticePrice[]>(`/api/practices/${id}/prices`, {
      method: "PUT",
      body: JSON.stringify({ prices: payload }),
    }),

  getInsurances: () => request<InsuranceProvider[]>("/api/insuranceproviders"),
  createInsurance: (payload: Partial<InsuranceProvider>) =>
    request<InsuranceProvider>("/api/insuranceproviders", { method: "POST", body: JSON.stringify(payload) }),
  updateInsurance: (id: number, payload: Partial<InsuranceProvider>) =>
    request<InsuranceProvider>(`/api/insuranceproviders/${id}`, { method: "PUT", body: JSON.stringify(payload) }),
  deleteInsurance: (id: number) => request<void>(`/api/insuranceproviders/${id}`, { method: "DELETE" }),

  getAppointments: (query: URLSearchParams) => request<Appointment[]>(`/api/appointments?${query.toString()}`),
  createAppointment: (payload: Record<string, unknown>) =>
    request<Appointment>("/api/appointments", { method: "POST", body: JSON.stringify(payload) }),
  updateAppointment: (id: number, payload: Record<string, unknown>) =>
    request<Appointment>(`/api/appointments/${id}`, { method: "PUT", body: JSON.stringify(payload) }),

  getBillingSummary: (year: number, month: number) =>
    request<BillingSummaryDto>(`/api/billing/monthly?year=${year}&month=${month}`),
};
