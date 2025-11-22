import { useMemo } from "react";
import { type BillingProviderSummaryDto } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useBillingSummary } from "./hooks/useBillingSummary";

const now = new Date();
const initialMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export function BillingPanel() {
  const { summary, loading, error, selectedMonth, setSelectedMonth } = useBillingSummary(initialMonth);

  const providerList = useMemo(() => summary?.providers ?? [], [summary]);
  const practiceTotals = useMemo(() => {
    if (!summary) return [];
    const totals = new Map<
      number,
      {
        practiceId: number;
        practiceName: string;
        amount: number;
      }
    >();

    summary.providers.forEach((provider) => {
      provider.practices.forEach((practice) => {
        const current = totals.get(practice.practiceId);
        const amount = (current?.amount ?? 0) + practice.amount;
        totals.set(practice.practiceId, {
          practiceId: practice.practiceId,
          practiceName: practice.practiceName,
          amount,
        });
      });
    });

    return Array.from(totals.values())
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [summary]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Resumen mensual</CardTitle>
          <CardDescription>Consulta rápidamente qué facturar por obra social.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="month-input">
              Mes
            </label>
            <Input
              id="month-input"
              type="month"
              value={selectedMonth}
              onChange={(event) => setSelectedMonth(event.target.value)}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {loading && <p className="text-sm text-muted-foreground">Calculando...</p>}

          {summary && (
            <div className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">
                Total del período {summary.month}/{summary.year}
              </p>
              <p className="text-3xl font-semibold text-primary">
                ${summary.totalAmount.toLocaleString("es-AR")}
              </p>
              {practiceTotals.length > 0 && (
                <div className="mt-4 space-y-1 text-sm text-muted-foreground">
                  {practiceTotals.map((practice) => (
                    <div key={practice.practiceId} className="flex items-center justify-between">
                      <span>{practice.practiceName}</span>
                      <span>${practice.amount.toLocaleString("es-AR")}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Detalle por obra social</CardTitle>
          <CardDescription>Incluye la cantidad de prácticas y montos.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Calculando...</p>
          ) : providerList.length === 0 ? (
            <p className="text-sm text-muted-foreground">Todavía no hay datos para mostrar.</p>
          ) : (
            providerList.map((provider: BillingProviderSummaryDto) => (
              <div key={provider.insuranceProviderId} className="mb-6 rounded-lg border p-4 last:mb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium">{provider.insuranceProviderName}</p>
                    <p className="text-sm text-muted-foreground">
                      Total: ${provider.totalAmount.toLocaleString("es-AR")}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {provider.practices.reduce((acc, item) => acc + item.quantity, 0)} prácticas
                  </span>
                </div>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Práctica</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead className="text-right">Importe</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {provider.practices.map((practice) => (
                      <TableRow key={practice.practiceId}>
                        <TableCell>{practice.practiceName}</TableCell>
                        <TableCell>{practice.quantity}</TableCell>
                        <TableCell className="text-right">${practice.amount.toLocaleString("es-AR")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
