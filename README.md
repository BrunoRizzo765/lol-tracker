# LoL Friends Tracker

Dashboard privado para ver rangos, partidas y scoreboards de un grupo de amigos usando la Riot Games API. Los amigos se guardan en Postgres y se pueden agregar/quitar desde la UI.

## Requisitos
- Node.js 20+
- Riot API key
- Postgres (`DATABASE_URL`)

## Configuración local
1. Copiá `.env.example` a `.env.local`.
2. Poné tu `RIOT_API_KEY` real de [developer.riotgames.com](https://developer.riotgames.com) en `.env.local` (sin esto no hay rangos ni partidas). Las Development keys caducan cada 24 horas.
3. Levantá Postgres (opción rápida con Docker):

```bash
docker compose up -d
```

4. En `.env.local` dejá `DATABASE_URL=postgresql://lol:lol@localhost:5432/lol_tracker` (o la URL de Neon/Supabase).
5. Opcional: `FRIENDS=Name#TAG,...` seedea la tabla la primera vez que esté vacía.
6. `RIOT_REGION` / `RIOT_REGIONAL` son solo el servidor por defecto (LAS es `la2`, LAN es `la1`). Podés mezclar amigos de cualquier región (LAS, EUW, KR, etc.): al agregarlos el tracker detecta su servidor y lo guarda; rangos, partidas y live se consultan en la región correcta de cada uno.
7. Ejecutá `pnpm install` (o `npm install`) y después `pnpm dev`.

## Historial de partidas
Las partidas se guardan en Postgres (`matches`):
- **Primera carga** (amigo nuevo o DB vacía): trae todo el historial disponible en Riot.
- **Actualizar partidas**: solo trae partidas nuevas desde la última sincronización.
- **Mostrar más**: pagina lo ya guardado en la base, sin llamar a Riot.

## Uso
- **Agregar amigo:** formulario arriba del dashboard (`GameName#TAG`). Valida el Riot ID contra la API antes de guardar.
- **Quitar amigo:** botón ✕ en cada perfil.
- **Rangos:** ladder + tarjeta de cada jugador (Solo/Dúo, o Flex si no tiene Solo).
- **Detalle de partida:** click en una partida del listado para ver el scoreboard completo con ítems.

## Deploy
Vercel + Postgres managed (Neon, Supabase, etc.). Agregá las mismas variables de entorno. La API key nunca se manda al navegador.

Importante: una Development API Key de Riot se desactiva cada 24 horas. Para un sitio que quede online, revisá las condiciones de Riot para Personal/Production keys.
