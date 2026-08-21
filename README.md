# FPJ IA — Backend

API de **FPJ IA**, plataforma para la gestión documental de
procedimientos de Policía Judicial (Colombia). Un funcionario diligencia
un formulario por bloques y el sistema genera automáticamente los
documentos oficiales de captura/aprehensión en flagrancia (FPJ 5, FPJ 6,
Acta de Incautación, FPJ 7, FPJ 8), incluida una narrativa de los hechos
redactada por IA.

## Stack

NestJS + Prisma + PostgreSQL. Autenticación con JWT (`@nestjs/passport`
+ `passport-jwt`). Documentos Word generados por reemplazo de tokens
`{{TOKEN}}` sobre plantillas `.docx` reales (ver `assets/documentos/`),
con la narrativa de los hechos generada por la API de Anthropic (ver
`docs/NARRATIVA-IA-FPJ5.md`).

## Requisitos

- Node.js
- PostgreSQL
- Una API key de Anthropic (para la generación de narrativa del FPJ-5)

## Puesta en marcha

```bash
npm install
```

Crear un archivo `.env` en la raíz con:

```
DATABASE_URL=postgresql://usuario:password@localhost:5432/fpj_ia
JWT_SECRET=...
ANTHROPIC_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
# Envío de correos (verificación de cuenta, notificaciones)
SMTP_HOST=...
SMTP_PORT=...
SMTP_USER=...
SMTP_PASS=...
SMTP_FROM=...
```

Luego:

```bash
npx prisma migrate deploy
npx prisma generate
npm run start:dev
```

El servidor arranca en el puerto configurado en `.env` (por defecto
`3000`). El frontend (repositorio separado, `FPJ-IA-frontend`) corre en
paralelo en otro puerto (por defecto `3001`).

## Estructura

- `src/` — un módulo de NestJS por entidad/funcionalidad (funcionario,
  intervinientes/capturados, testigos, víctimas, elementos incautados,
  actuaciones, documentos, narrativa, pagos, admin, auth).
- `prisma/schema.prisma` — modelo de datos. Las migraciones en
  `prisma/migrations/` son el historial real aplicado a la base de
  datos; no se editan ni se eliminan, incluso si quedan obsoletas.
- `assets/documentos/` — plantillas `.docx` reales que se rellenan por
  tokens para generar los documentos oficiales.
- `assets/prompts/` — el Prompt CORE de la narrativa IA:
  `core-transversal.md` (transversal a todos los delitos) más 4
  archivos `{prefijo}-*.md` por cada delito soportado.
- `docs/NARRATIVA-IA-FPJ5.md` — cómo funciona el motor de narrativa.

## Agregar un delito nuevo

Ver el checklist en el resumen técnico más reciente del proyecto:
registrar el delito en `src/narrativa/delitos.ts`, escribir los 4
archivos de prompt propios del delito (sin duplicar lo que ya cubre
`core-transversal.md`), y si el delito necesita un tipo de elemento
incautado propio, seguir el patrón de `ElementoIncautado.tipoElemento` +
modelo de detalle 1:1.

## Comandos útiles

```bash
npm run build          # compila con nest build
npm run start:dev      # desarrollo con recarga automática
npx prisma studio       # explorar la base de datos visualmente
npx prisma migrate dev  # crear una migración nueva en desarrollo
```
