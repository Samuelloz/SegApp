# SegApp

SaaS para empresas de seguridad privada. Monorepo pnpm:

- `apps/api`: NestJS + Prisma 7 + PostgreSQL.
- `apps/web`: Next.js + RTK Query.
- `packages/contracts` (`@segapp/contracts`): schemas Zod, tipos y permisos compartidos por API y web.

## Monorepo

- Las apps consumen `@segapp/contracts` desde `dist/`, no desde `src/`. Después de cambiar un contrato hay que compilarlo o las apps no verán el cambio.
- `pnpm dev` en la raíz ya compila contracts y lo deja en watch junto con api y web. Si levantas api o web por separado, mantén en otra terminal:
  `pnpm --filter @segapp/contracts dev`

## Comandos

- Base de datos: `docker compose up -d db`
- Migraciones (en `apps/api`): `npx prisma migrate dev`. Prisma 7 no regenera el cliente al migrar; ejecutar después `npx prisma generate`.
- Si una migración agrega una columna `NOT NULL` a una tabla con datos: generar con `--create-only` y editar el SQL (agregar opcional, rellenar, `SET NOT NULL`) antes de aplicarla.
- Crear el propietario de una empresa existente (en `apps/api`): `pnpm create-owner`, con las variables `OWNER_NAME`, `OWNER_EMAIL`, `OWNER_PASSWORD` (mínimo 15 caracteres) y `OWNER_COMPANY_SLUG`.
- Type-check del API, incluidos specs: `pnpm --filter api exec tsc --noEmit -p tsconfig.json`. No usar `npx tsc` desde la raíz: TypeScript no está instalado ahí y `npx` descarga un paquete ajeno llamado `tsc`.
- Type-check de todo el monorepo (sin specs del API): `pnpm typecheck`
- Tests del API: `pnpm --filter api test`, o `npx jest <ruta>` dentro de `apps/api`.
- Tests de web: `pnpm --filter web test` (`node --test`, archivos `*.test.mjs`).
- Lint de api y web (solo revisa): `pnpm lint`. Corregir lo automático, incluido el orden de imports, y formatear: `pnpm lint:fix`.
- Formato: `pnpm format` y `pnpm format:check`.

## Convenciones

- Orden de imports: lo aplica ESLint con `eslint-plugin-simple-import-sort` (grupos en `eslint.import-groups.mjs`); `pnpm lint:fix` lo corrige. Grupos separados por una línea en blanco:
  1. Imports que solo ejecutan algo (`import 'dotenv/config'`, CSS globales), en su orden original.
  2. Módulos de Node (`node:*`) y paquetes externos.
  3. Paquetes del workspace (`@segapp/contracts`).
  4. Alias de la app (`@/...`), solo en web.
  5. Imports relativos: primero `../` y luego `./`.
  6. Estilos importados con nombre (`*.module.css`).

  Dentro de cada grupo, orden alfabético. Usar `import type` o `type X` en los imports que solo aportan tipos.

- Separar código por responsabilidad o cuando se reutiliza; no crear abstracciones de un solo uso. Los schemas de formularios de web van en `<nombre>.schema.ts` junto a su página.
- Controladores del API: validan el body con el schema de `@segapp/contracts` (`safeParse`) y responden `BadRequestException` con el primer issue.
- Multi-tenancy: el `companyId` sale siempre de la sesión (`@CurrentCompanyId()`), nunca del cliente. Los endpoints protegidos usan `@UseGuards(SessionAuthGuard, RolesGuard)` con `@Roles(...rolesFor('<permiso>'))`, y los permisos se definen en `packages/contracts/src/permissions.ts`.
- Los textos visibles para el usuario van en español.

## Documentación

- Reglas de negocio y modelo comercial: `docs/product/`.
- Este archivo contiene solo instrucciones estables de desarrollo. Las decisiones de arquitectura o de dominio van en `docs/`, y la información de una tarea o rama concreta no se documenta aquí.
