import { useEffect, useState } from "react";
import { api, type InsuranceProvider } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const initialForm = {
  name: "",
  billingCode: "",
  contactEmail: "",
  contactPhone: "",
  notes: "",
};

export function InsurancesPanel() {
  const [items, setItems] = useState<InsuranceProvider[]>([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [pendingToggle, setPendingToggle] = useState<{ provider: InsuranceProvider; nextState: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const response = await api.getInsurances();
      setItems(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las obras sociales");
    } finally {
      setLoading(false);
    }
  }

  function requestToggle(provider: InsuranceProvider) {
    setPendingToggle({ provider, nextState: !provider.isActive });
  }

  async function handleToggleStatus(provider: InsuranceProvider, nextState: boolean) {
    try {
      setUpdatingId(provider.id);
      setError(null);
      const payload = {
        name: provider.name,
        billingCode: provider.billingCode ?? undefined,
        contactEmail: provider.contactEmail ?? undefined,
        contactPhone: provider.contactPhone ?? undefined,
        notes: provider.notes ?? undefined,
        isActive: nextState,
      };
      const updated = await api.updateInsurance(provider.id, payload);
      setItems((prev) => prev.map((item) => (item.id === provider.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la obra social");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmToggle() {
    if (!pendingToggle) return;
    await handleToggleStatus(pendingToggle.provider, pendingToggle.nextState);
    setPendingToggle(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name) return;

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        billingCode: form.billingCode || undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        notes: form.notes || undefined,
      };
      const created = await api.createInsurance(payload);
      setItems((prev) => [created, ...prev]);
      setForm(initialForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la obra social");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nueva obra social</CardTitle>
          <CardDescription>Registra cuentas a facturar y datos de contacto.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Swiss Medical"
                required
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="code">Código</Label>
                <Input
                  id="code"
                  value={form.billingCode}
                  onChange={(event) => setForm({ ...form, billingCode: event.target.value })}
                  placeholder="SWISS"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  value={form.contactPhone}
                  onChange={(event) => setForm({ ...form, contactPhone: event.target.value })}
                  placeholder="0800..."
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.contactEmail}
                  onChange={(event) => setForm({ ...form, contactEmail: event.target.value })}
                  placeholder="facturacion@obra.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  rows={3}
                  value={form.notes}
                  onChange={(event) => setForm({ ...form, notes: event.target.value })}
                  placeholder="Datos útiles para la facturación"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar"}
              </Button>
              <Button type="button" variant="ghost" onClick={refresh} disabled={loading}>
                Actualizar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="overflow-x-auto">
        <CardHeader>
          <CardTitle>Obras sociales registradas</CardTitle>
          <CardDescription>Información para consultar al facturar.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Cargando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.billingCode ?? "-"}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        {item.contactEmail && <span>{item.contactEmail}</span>}
                        {item.contactPhone && (
                          <span className="text-xs text-muted-foreground">{item.contactPhone}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="space-y-2 text-right">
                      <Badge variant={item.isActive ? "success" : "secondary"}>
                        {item.isActive ? "Activa" : "No disponible"}
                      </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestToggle(item)}
                        disabled={updatingId === item.id}
                      >
                        {item.isActive ? "Desactivar" : "Activar"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
      <ConfirmDialog
        open={pendingToggle !== null}
        title="Confirmar cambio de estado"
        description={
          pendingToggle
            ? `¿Deseas ${pendingToggle.nextState ? "activar" : "desactivar"} la obra social ${pendingToggle.provider.name}?`
            : undefined
        }
        confirmLabel="Sí"
        cancelLabel="Cancelar"
        onConfirm={() => {
          void confirmToggle();
        }}
        onCancel={() => setPendingToggle(null)}
      />
    </>
  );
}
