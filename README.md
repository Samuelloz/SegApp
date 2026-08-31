# SegApp

Software SaaS para la gestión de empresas de seguridad privada.

## 📋 Descripción

SegApp es una plataforma para administrar la operación de empresas de seguridad privada, incluyendo personal operativo, contratos, asignaciones y configuración empresarial.

El proyecto está diseñado como una aplicación SaaS escalable y actualmente se encuentra en desarrollo activo.

## 🚀 Stack tecnológico

- Frontend: Next.js 16, React y TypeScript
- Backend: NestJS, Prisma y PostgreSQL
- Estado y consumo del API: Redux Toolkit y RTK Query
- Formularios y validación: React Hook Form y Zod
- Contratos compartidos: paquete interno `@segapp/contracts`
- UI: componentes propios y Sonner
- Monorepo: PNPM Workspaces

## 🧱 Estructura del proyecto

```text
SegApp/
├── apps/
│   ├── api/           # API REST con NestJS y Prisma
│   └── web/           # Aplicación web con Next.js
├── packages/
│   └── contracts/     # Schemas y tipos compartidos
├── package.json
├── pnpm-lock.yaml
└── pnpm-workspace.yaml
```

## 📦 Requisitos

- Node.js 20.9 o superior
- PNPM 10
- PostgreSQL
- Docker (opcional)

## ⚙️ Instalación

Clona el repositorio e instala las dependencias:

```bash
git clone https://github.com/Samuelloz/SegApp.git
cd SegApp
pnpm install
```

Configura las variables de entorno necesarias para el API y el frontend.

Después prepara Prisma:

```bash
pnpm --filter api exec prisma generate
pnpm --filter api exec prisma migrate dev
```

## 💻 Desarrollo

Desde la raíz del repositorio ejecuta:

```bash
pnpm dev
```

Este comando inicia:

- El paquete de contratos compartidos en modo watch.
- La API de NestJS.
- La aplicación web de Next.js.

## 🏗️ Compilación

```bash
pnpm build
```

El paquete `@segapp/contracts` se compila antes que el API y el frontend.

## ✅ Validación de tipos

```bash
pnpm typecheck
```

## ✨ Funcionalidades actuales

- Gestión de guardias.
- Gestión de contratos.
- Asignación de guardias a contratos.
- Historial de asignaciones.
- Configuración general de la empresa.
- Validaciones compartidas entre frontend y backend.
- Interfaz adaptable a escritorio y dispositivos móviles.

## 🗺️ Roadmap

- Expediente completo de guardias.
- Información ampliada de contratos.
- Turnos y descansos.
- Usuarios, roles y permisos.
- Supervisores y vehículos.
- Control de asistencia con fotografía y geolocalización.
- Evaluaciones periódicas.
- Rondines.
- Visualización operativa en mapa.
- Configuración de apariencia y operación por empresa.

## 🚧 Estado

Proyecto en desarrollo activo.

## 🔒 Licencia

Software privado. Todos los derechos reservados.
