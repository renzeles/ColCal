# Colcal — Setup

## 1. Levantar en modo mock (sin Supabase)

```bash
npm run dev
```

Abrí http://localhost:3000 — vas a ver el calendario con eventos de ejemplo. El proxy de auth detecta que no hay credenciales de Supabase y deja pasar todo.

## 2. Conectar Supabase

### a) Crear proyecto

1. Andá a https://supabase.com → "New project"
2. Anotá la **Project URL** y la **anon public key** (Settings → API)

### b) Configurar Google OAuth

1. En Supabase: **Authentication → Providers → Google**, activalo
2. Te va a pedir un Client ID/Secret de Google
3. Andá a https://console.cloud.google.com → APIs & Services → Credentials → Create OAuth Client ID (Web app)
4. **Authorized redirect URI** → copiala desde Supabase (algo tipo `https://xxx.supabase.co/auth/v1/callback`)
5. Pegá el Client ID/Secret en Supabase → Save

### c) Cargar el schema

1. Supabase Dashboard → **SQL Editor** → New query
2. Pegá el contenido de `supabase/migrations/001_initial.sql`
3. Run

### d) Variables de entorno

Editá `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reiniciá `npm run dev`. Ahora `/` redirige a `/login` si no estás autenticado.

## 3. Próximos pasos (no implementado todavía)

- Reemplazar mocks en `Sidebar.tsx` con datos de Supabase
- Reemplazar mocks en `app/page.tsx` con fetch de eventos según la `selection`
- Modal de crear/editar evento (subir imagen a `event-images`)
- Búsqueda y agregar amigos
- Crear grupos y compartir eventos

## Estructura

```
app/
  login/page.tsx       — pantalla de login
  auth/callback/       — OAuth callback
  page.tsx             — vista principal (sidebar + calendario)
  layout.tsx
  globals.css          — estilos Apple-like + overrides FullCalendar
components/
  sidebar/Sidebar.tsx
  calendar/
    CalendarArea.tsx   — header + toggle (grilla/eventos)
    GridCalendar.tsx   — FullCalendar wrapper
    EventFeed.tsx      — feed de cards agrupado por día
    EventCard.tsx      — card con foto + título + descripción
lib/
  supabase/
    client.ts          — cliente browser
    server.ts          — cliente server components
    proxy.ts           — refresh de sesión + redirects
  types.ts
  utils.ts             — cn() helper
proxy.ts               — Next 16 middleware (renombrado a "proxy")
supabase/
  migrations/001_initial.sql
```
