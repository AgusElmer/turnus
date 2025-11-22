import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { type InsuranceProvider } from "@/lib/api";

interface AppointmentFiltersProps {
    filters: { from: string; to: string; insuranceProviderId: string };
    onFiltersChange: (filters: { from: string; to: string; insuranceProviderId: string }) => void;
    insurances: InsuranceProvider[];
}

export function AppointmentFilters({ filters, onFiltersChange, insurances }: AppointmentFiltersProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
                <Label htmlFor="from">Desde</Label>
                <Input
                    id="from"
                    type="date"
                    value={filters.from}
                    onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="to">Hasta</Label>
                <Input
                    id="to"
                    type="date"
                    value={filters.to}
                    onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
                />
            </div>
            <div className="space-y-2">
                <Label htmlFor="insuranceFilter">Obra social</Label>
                <select
                    id="insuranceFilter"
                    className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={filters.insuranceProviderId}
                    onChange={(event) => onFiltersChange({ ...filters, insuranceProviderId: event.target.value })}
                >
                    <option value="">Todas</option>
                    {insurances.map((insurance) => (
                        <option key={insurance.id} value={insurance.id.toString()}>
                            {insurance.name}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
