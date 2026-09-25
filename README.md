# LoL Friends Tracker

Dashboard privado para ver rangos, partidas y scoreboards de un grupo de amigos usando la Riot Games API. Los amigos se guardan en Postgres y se pueden agregar/quitar desde la UI.

## Requisitos
- Node.js 20+
- Riot API key
- Postgres (`DATABASE_URL`)

## Configuración local
1. Copiá `.env.example` a `.env.local`.
2. Poné tu `RIOT_API_KEY`.
3. Levantá Postgres (opción rápida con Docker):

```bash
docker compose up -d
```

4. En `.env.local` dejá `DATABASE_URL=postgresql://lol:lol@localhost:5432/lol_tracker` (o la URL de Neon/Supabase).
5. Opcional: `FRIENDS=Name#TAG,...` seedea la tabla la primera vez que esté vacía.
6. Para LAS usá `RIOT_REGION=la1` y `RIOT_REGIONAL=americas`.
7. Ejecutá `pnpm install` (o `npm install`) y después `pnpm dev`.

La tabla `friends` se crea sola al primer request.

## Uso
- **Agregar amigo:** formulario arriba del dashboard (`GameName#TAG`). Valida el Riot ID contra la API antes de guardar.
- **Quitar amigo:** botón ✕ en cada perfil.
- **Rangos:** ladder + tarjeta de cada jugador (Solo/Dúo, o Flex si no tiene Solo).
- **Detalle de partida:** click en una partida del listado para ver el scoreboard completo con ítems.

## Deploy
Vercel + Postgres managed (Neon, Supabase, etc.). Agregá las mismas variables de entorno. La API key nunca se manda al navegador.

Importante: una Development API Key de Riot se desactiva cada 24 horas. Para un sitio que quede online, revisá las condiciones de Riot para Personal/Production keys.
