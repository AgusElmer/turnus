import { useEffect, useState } from "react";
import { api, type Practice } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const defaultForm = {
  name: "",
  billingCode: "",
  description: "",
  defaultPrice: "",
};

export function PracticesPanel() {
  const [items, setItems] = useState<Practice[]>([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ practiceId: "", defaultPrice: "" });
  const [updatingPrice, setUpdatingPrice] = useState(false);
  const [pendingToggle, setPendingToggle] = useState<{ practice: Practice; nextState: boolean } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      setLoading(true);
      const response = await api.getPractices();
      setItems(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudieron cargar las prácticas");
    } finally {
      setLoading(false);
    }
  }

  function handleEditSelect(practiceId: string) {
    setEditForm({
      practiceId,
      defaultPrice: practiceId ? String(items.find((item) => item.id === Number(practiceId))?.defaultPrice ?? "") : "",
    });
  }

  async function handleUpdatePrice(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editForm.practiceId || !editForm.defaultPrice) return;

    const practice = items.find((item) => item.id === Number(editForm.practiceId));
    if (!practice) return;

    try {
      setUpdatingPrice(true);
      setError(null);
      const payload = {
        name: practice.name,
        billingCode: practice.billingCode,
        description: practice.description ?? undefined,
        defaultPrice: Number(editForm.defaultPrice),
        isActive: practice.isActive,
      };
      const updated = await api.updatePractice(practice.id, payload);
      setItems((prev) => prev.map((item) => (item.id === practice.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo actualizar el precio");
    } finally {
      setUpdatingPrice(false);
    }
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
          <CardTitle>Actualizar valor de práctica</CardTitle>
          <CardDescription>Selecciona una práctica existente para editar su valor base.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleUpdatePrice}>
            <div className="space-y-2">
              <Label htmlFor="editPractice">Práctica</Label>
              <select
                id="editPractice"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={editForm.practiceId}
                onChange={(event) => handleEditSelect(event.target.value)}
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
            <div className="space-y-2">
              <Label htmlFor="editPrice">Valor base ($)</Label>
              <Input
                id="editPrice"
                type="number"
                min="0"
                step="100"
                value={editForm.defaultPrice}
                onChange={(event) => setEditForm((prev) => ({ ...prev, defaultPrice: event.target.value }))}
                placeholder="Introduce el nuevo valor"
                required
                disabled={!editForm.practiceId}
              />
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" disabled={!editForm.practiceId || updatingPrice}>
                {updatingPrice ? "Actualizando..." : "Guardar cambios"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => handleEditSelect("")}>
                Limpiar
              </Button>
            </div>
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
