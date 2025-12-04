# Turnus

Sistema simple para administrar pacientes, prácticas, obras sociales y facturación mensual de un consultorio.

## Stack seleccionado

- **Backend**: ASP.NET Core 8 Web API + Entity Framework Core + PostgreSQL
- **Frontend**: React + Vite + TypeScript + Tailwind (estilo shadcn/ui) con textos en español
- **Base de datos**: PostgreSQL 16
- **Infraestructura local**: Docker Compose (API, web, PostgreSQL, pgAdmin)

## Requisitos previos

- .NET 8 SDK (`dotnet`) para desarrollo del backend.
- Node.js 22+ y npm para el frontend.
- Docker + Docker Compose (para el entorno completo con base de datos).

> En Windows + WSL conviene instalar .NET y Node dentro de WSL y ejecutar todos los comandos desde ahí.

## Estructura del proyecto

```
backend/Turnus.Api    -> Web API + EF Core + migraciones
frontend/             -> App Vite + React
Turnus.sln            -> Solución .NET
Dockerfile(s)         -> backend/frontend/ para despliegue
```

## Arquitectura

La aplicación sigue una arquitectura de N-capas con una clara separación de responsabilidades:

### Backend

- **API Controllers**: Responsables de manejar las solicitudes HTTP, validar la entrada y orquestar las operaciones. Son "delgados" y delegan la lógica de negocio a los servicios.
- **Services**: Contienen la lógica de negocio principal de la aplicación. Se comunican con la capa de datos para realizar operaciones CRUD y ejecutar reglas de negocio.
- **Validators**: Usan FluentValidation para definir y aplicar reglas de validación a los DTOs de entrada, asegurando la integridad de los datos.
- **Data (DbContext)**: Utiliza Entity Framework Core para el acceso a datos y la gestión del esquema de la base de datos a través de migraciones.
- **Domain**: Contiene las entidades principales del modelo de datos.
- **Contracts (DTOs)**: Definen la forma de los datos que se transfieren entre el cliente y el servidor.

### Frontend

- **Features**: Cada área funcional (pacientes, prácticas, etc.) está organizada en su propio directorio.
- **Components**: Componentes de React reutilizables y específicos de cada feature. Los componentes de UI genéricos se encuentran en `src/components/ui`.
- **Hooks**: Hooks personalizados que encapsulan la lógica de acceso a la API y el manejo del estado para cada feature (ej. `usePatients`, `usePractices`).
- **State Management**: El estado se gestiona a nivel de componente con `useState` y se comparte a través de hooks personalizados. Para el manejo de formularios se utiliza `react-hook-form`.
- **API Layer**: Un cliente de API centralizado en `src/lib/api.ts` maneja todas las solicitudes HTTP al backend.

## Configuración inicial (.env)

1. Copiá `.env.example` a `.env` y completa los valores:
   - Credenciales de PostgreSQL (`POSTGRES_*`).
   - `ConnectionStrings__Default` para que la API se conecte al contenedor de PostgreSQL.
   - `Authentication__Google__ClientId` + `Authentication__Google__AllowedEmails__0` (uno por usuario permitido).
   - `VITE_API_BASE_URL` y `VITE_GOOGLE_CLIENT_ID` para que el frontend apunte al backend y a tu OAuth client.
2. (Opcional) crea `frontend/.env` si querés diferentes valores locales para Vite.

## Ejecutar en modo desarrollo

### API (.NET)

```bash
# Restaurar dependencias
export DOTNET_CLI_HOME="$(pwd)/.dotnet_cli"
export PATH="$(pwd)/.dotnet:$PATH"
dotnet restore backend/Turnus.Api/Turnus.Api.csproj

# Ejecutar la API (requiere PostgreSQL levantado)
dotnet run --project backend/Turnus.Api/Turnus.Api.csproj
```

La API espera la cadena `ConnectionStrings:Default` (appsettings) o la variable `ConnectionStrings__Default`. Para desarrollo puedes apuntarla a `Host=localhost;Port=5432;Database=turnus;Username=postgres;Password=postgres`.

### Frontend (Vite)

```bash
cd frontend
npm install
npm run dev # expone http://localhost:5173
```

Configura `VITE_API_BASE_URL` en un archivo `.env` (por ejemplo `VITE_API_BASE_URL=http://localhost:8080`).

### Base de datos y herramientas

```bash
docker compose up db pgadmin
```

pgAdmin queda en `http://localhost:5050` (usuario `admin@example.com`, contraseña `admin1234`).

## Autenticación con Google

La API valida tokens de Google (ID Token) directamente. Pasos:

1. Crea un proyecto en [Google Cloud Console](https://console.cloud.google.com/), habilita "OAuth consent screen" con tipo interno/externo.
2. Crea credenciales "OAuth client ID" de tipo Web.
3. Agrega como orígenes/URIs autorizados las URLs donde correrá el frontend (`http://localhost:5173`, `https://turnus.tu-dominio.com`, etc.).
4. Copia el `Client ID` en `Authentication__Google__ClientId` y `VITE_GOOGLE_CLIENT_ID`.
5. Lista los correos permitidos en `Authentication__Google__AllowedEmails__0`, `AllowedEmails__1`, etc. Las solicitudes rechazadas por la API responden 401.

El backend aplica la política `[Authorize]` en todos los controladores y sólo acepta las cuentas configuradas.

## Docker Compose (todo el stack)

Levanta API, frontend, PostgreSQL y pgAdmin con un comando:

```bash
docker compose up --build
```

Servicios expuestos:

- API: http://localhost:8080
- Web: http://localhost:5173
- PostgreSQL: localhost:5432
- pgAdmin: http://localhost:5050

Antes de ejecutar, asegurate de tener `.env` con los secretos que usará `docker compose`. La API ejecuta migraciones automáticamente al iniciar. El seeding con datos ficticios sólo corre si `Database__SeedDemoData=true`.

## Gestión de precios por obra social

- Cada práctica define un valor "Particular" (sin obra social) y montos específicos por obra social.
- Desde el panel de Prácticas podés editar todos los valores: seleccioná una práctica y completa la tabla con los importes correspondientes.
- Al crear turnos, la API calcula automáticamente el precio base usando la combinación práctica/obra social; si no hay valor definido, usa el monto particular.

## Migraciones EF Core

```bash
cd backend
# crear nuevos cambios en Data/Migrations
dotnet ef migrations add NombreMigracion --project Turnus.Api/Turnus.Api.csproj --startup-project Turnus.Api/Turnus.Api.csproj --output-dir Data/Migrations
# aplicar a la base configurada
dotnet ef database update --project Turnus.Api/Turnus.Api.csproj --startup-project Turnus.Api/Turnus.Api.csproj
```

## Pruebas rápidas

- `dotnet build backend/Turnus.Api/Turnus.Api.csproj`
- `npm run build` dentro de `frontend`

## Próximos pasos sugeridos

1. **Roles y permisos**: ahora que hay autenticación, definir si habrá usuarios sólo lectura vs. administradores.
2. **Auditoría**: loguear cambios críticos (creación/borrado) con el email del usuario autenticado.
3. **Reportes y exportaciones**: exportar resúmenes a Excel/PDF.
4. **Alertas**: recordatorios por WhatsApp/mail usando servicios externos (Twilio, Sendgrid, etc.).
5. **Observabilidad**: añadir logs estructurados (Serilog) y métricas básicas para monitorear la VM.

# Turnus – Nginx & Certbot setup (Ubuntu VM)

- Domain: `turnus-consultorio.com`
- App: Turnus (web + API)

## Nginx

- Web site config:
  - `/etc/nginx/sites-available/turnus-web`
  - Enabled via symlink in `/etc/nginx/sites-enabled/turnus-web`
- API site config:
  - `/etc/nginx/sites-available/turnus-api`
  - Enabled via symlink in `/etc/nginx/sites-enabled/turnus-api`

## TLS / Certbot

- Live cert + key:
  - `/etc/letsencrypt/live/turnus-consultorio.com/fullchain.pem`
  - `/etc/letsencrypt/live/turnus-consultorio.com/privkey.pem`
- Nginx SSL options:
  - `/etc/letsencrypt/options-ssl-nginx.conf`
  - `/etc/letsencrypt/ssl-dhparams.pem`
- Renewal config:
  - `/etc/letsencrypt/renewal/turnus-consultorio.com.conf`
