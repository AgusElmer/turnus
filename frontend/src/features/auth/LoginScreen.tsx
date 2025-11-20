import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "./AuthContext";

export function LoginScreen() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  async function handleSuccess(credential?: string) {
    if (!credential) {
      setError("No se recibió token de Google");
      return;
    }
    try {
      setError(null);
      await signInWithGoogle(credential);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar sesión");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Ingresá al consultorio</CardTitle>
          <CardDescription>Autentícate con tu cuenta de Google autorizada.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!googleClientId && (
            <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              Falta configurar VITE_GOOGLE_CLIENT_ID para habilitar el login.
            </p>
          )}
          <GoogleLogin
            onSuccess={(response) => {
              void handleSuccess(response.credential);
            }}
            onError={() => setError("No se pudo autenticar con Google")}
            useOneTap
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <p className="text-xs text-muted-foreground">
            Solo el personal habilitado puede acceder. Si necesitás permisos escribime y te agrego.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
