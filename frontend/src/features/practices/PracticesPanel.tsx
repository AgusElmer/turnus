import { useEffect, useState } from "react";
import { api, type InsuranceProvider, type Practice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Alert } from "@/components/ui/alert";

const defaultForm = {
  name: "",
  billingCode: "",
  description: "",
  defaultPrice: "",
};

export function PracticesPanel() {
  const [items, setItems] = useState<Practice[]>([]);
  const [insurances, setInsurances] = useState<InsuranceProvider[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [priceEditor, setPriceEditor] = useState<{ practiceId: string; values: Record<string, string> }>({ practiceId: "", values: {} });
  const [savingPrices, setSavingPrices] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ practice: Practice; nextState: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const [practicesData, insurancesData] = await Promise.all([api.getPractices(), api.getInsurances()]);
      setItems(practicesData);
      setInsurances(insurancesData);
      if (priceEditor.practiceId) {
        initializePriceEditor(priceEditor.practiceId, practicesData, insurancesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las prácticas");
    } finally {
      setLoading(false);
    }
  }

  function initializePriceEditor(
    practiceId: string,
    practiceList: Practice[] = items,
    insuranceList: InsuranceProvider[] = insurances,
  ) {
    if (!practiceId) {
      setPriceEditor({ practiceId: "", values: {} });
      setSuccessMessage(null);
      return;
    }

    const practice = practiceList.find((item) => item.id === Number(practiceId));
    if (!practice) {
      setPriceEditor({ practiceId: "", values: {} });
      return;
    }

    const values: Record<string, string> = {};
    const priceMap = new Map<string, string>();
    practice.prices.forEach((price) => {
      const key = price.insuranceProviderId == null ? "particular" : price.insuranceProviderId.toString();
      priceMap.set(key, price.price.toString());
    });

    values.particular = priceMap.get("particular") ?? practice.defaultPrice.toString();
    insuranceList.forEach((insurance) => {
      const key = insurance.id.toString();
      values[key] = priceMap.get(key) ?? practice.defaultPrice.toString();
    });

    setPriceEditor({ practiceId, values });
    setSuccessMessage(null);
  }

  function requestToggle(practice: Practice) {
    setPendingToggle({ practice, nextState: !practice.isActive });
  }

  async function handleToggleStatus(practice: Practice, nextState: boolean) {
    try {
      setUpdatingId(practice.id);
      setError(null);
      const payload = {
        name: practice.name,
        billingCode: practice.billingCode,
        description: practice.description ?? undefined,
        defaultPrice: practice.defaultPrice,
        isActive: nextState,
      };
      const updated = await api.updatePractice(practice.id, payload);
      setItems((prev) => prev.map((item) => (item.id === practice.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar la práctica");
    } finally {
      setUpdatingId(null);
    }
  }

  async function confirmToggle() {
    if (!pendingToggle) return;
    await handleToggleStatus(pendingToggle.practice, pendingToggle.nextState);
    setPendingToggle(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.name || !form.billingCode || !form.defaultPrice) return;

    try {
      setSaving(true);
      setError(null);
      const payload = {
        name: form.name,
        billingCode: form.billingCode,
        description: form.description || undefined,
        defaultPrice: Number(form.defaultPrice),
      };
      const created = await api.createPractice(payload);
      setItems((prev) => [created, ...prev]);
      setForm(defaultForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar la práctica");
    } finally {
      setSaving(false);
    }
  }

  async function handleSavePrices(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!priceEditor.practiceId) {
      return;
    }

    const payloadEntries = Object.entries(priceEditor.values);
    if (payloadEntries.some(([, value]) => !value)) {
      setError("Completa todos los valores antes de guardar.");
      return;
    }

    const payload = payloadEntries.map(([key, value]) => ({
      insuranceProviderId: key === "particular" ? null : Number(key),
      price: Number(value),
    }));

    try {
      setSavingPrices(true);
      setError(null);
      const updatedPrices = await api.updatePracticePrices(Number(priceEditor.practiceId), payload);
      const particularPrice = updatedPrices.find((price) => price.insuranceProviderId == null)?.price ?? 0;
      const updatedList = items.map((item) =>
        item.id === Number(priceEditor.practiceId)
          ? { ...item, prices: updatedPrices, defaultPrice: particularPrice || item.defaultPrice }
          : item,
      );
      setItems(updatedList);
      initializePriceEditor(priceEditor.practiceId, updatedList, insurances);
      setSuccessMessage("Valores actualizados correctamente");
      setError(null);
      window.setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron actualizar los valores");
    } finally {
      setSavingPrices(false);
    }
  }

  function handlePriceInputChange(key: string, value: string) {
    setPriceEditor((prev) => ({
      ...prev,
      values: {
        ...prev.values,
        [key]: value,
      },
    }));
  }

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Nueva práctica</CardTitle>
          <CardDescription>Define los códigos y valores a facturar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Ecografía"
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
                  placeholder="ECO01"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Valor base ($)</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="100"
                  value={form.defaultPrice}
                  onChange={(event) => setForm({ ...form, defaultPrice: event.target.value })}
                  placeholder="8000"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Detalles útiles para el equipo"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando..." : "Guardar práctica"}
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
          <CardTitle>Listado de prácticas</CardTitle>
          <CardDescription>Valores de referencia vigentes.</CardDescription>
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
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.billingCode}</TableCell>
                    <TableCell className="text-right">${item.defaultPrice.toLocaleString("es-AR")}</TableCell>
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

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Valores por obra social</CardTitle>
          <CardDescription>Configura importes específicos para cada práctica e institución.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSavePrices}>
            {successMessage && <Alert variant="success">{successMessage}</Alert>}
            <div className="space-y-2">
              <Label htmlFor="pricePractice">Práctica</Label>
              <select
                id="pricePractice"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={priceEditor.practiceId}
                onChange={(event) => initializePriceEditor(event.target.value)}
                required
              >
                <option value="">Selecciona una práctica</option>
                {items.map((practice) => (
                  <option key={practice.id} value={practice.id}>
                    {practice.name} ({practice.billingCode})
                  </option>
                ))}
              </select>
            </div>
            {priceEditor.practiceId ? (
              <div className="space-y-4">
                {error && <p className="text-sm text-destructive">{error}</p>}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Obra social</TableHead>
                      <TableHead className="text-right">Valor ($)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Particular</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          step="100"
                          required
                          value={priceEditor.values.particular ?? ""}
                          onChange={(event) => handlePriceInputChange("particular", event.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                    {insurances.map((insurance) => (
                      <TableRow key={insurance.id}>
                        <TableCell className="font-medium">{insurance.name}</TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            min="0"
                            step="100"
                            required
                            value={priceEditor.values[insurance.id.toString()] ?? ""}
                            onChange={(event) => handlePriceInputChange(insurance.id.toString(), event.target.value)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center gap-3">
                  <Button type="submit" disabled={savingPrices}>
                    {savingPrices ? "Guardando..." : "Guardar valores"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => initializePriceEditor(priceEditor.practiceId)}>
                    Restablecer
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Selecciona una práctica para editar sus valores.</p>
            )}
          </form>
        </CardContent>
      </Card>
      </div>
      <ConfirmDialog
        open={pendingToggle !== null}
        title="Confirmar cambio de estado"
        description={
          pendingToggle
            ? `¿Deseas ${pendingToggle.nextState ? "activar" : "desactivar"} la práctica ${pendingToggle.practice.name}?`
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
