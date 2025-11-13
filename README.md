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

La API ejecuta migraciones automáticamente al iniciar y carga datos de ejemplo (paciente, prácticas y obras sociales).

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

1. **Autenticación**: incorporar Identity + JWT o un proveedor externo (Auth0/Azure AD B2C) según el entorno de despliegue.
2. **Roles y permisos**: restringir acciones (ej. solo admins pueden borrar prácticas).
3. **Estados avanzados**: admitir múltiples tipos de prácticas por turno, adjuntar archivos/comprobantes.
4. **Reportes**: exportar a Excel o PDF los resúmenes mensuales.
5. **Alertas**: enviar recordatorios por WhatsApp/mail usando un job scheduler (Hangfire/Quartz) o servicios externos.
6. **Observabilidad**: añadir logs estructurados (Serilog) y métricas básicas.

Con esto ya puedes correr el entorno completo, practicar flujos típicos y seguir iterando con tecnología moderna.
