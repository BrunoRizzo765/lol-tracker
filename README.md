# LoL Friends Tracker

Dashboard privado para ver las últimas partidas de un grupo de amigos usando la Riot Games API.

## Requisitos
- Node.js 20+
- Riot API key

## Configuración local
1. Copiá `.env.example` a `.env.local`.
2. Poné tu `RIOT_API_KEY`.
3. En `FRIENDS`, agregá los Riot IDs como `GameName#TAG`, separados por comas.
4. Para LAS usá `RIOT_REGION=la1` y `RIOT_REGIONAL=americas`.
5. Ejecutá `npm install` y después `npm run dev`.

## Deploy gratis
Vercel puede desplegar este proyecto sin costo en su plan Hobby. En el proyecto agregá las mismas variables de entorno. La API key nunca se manda al navegador: solo la usa el route handler de Next.js.

Importante: una Development API Key de Riot se desactiva cada 24 horas. Para un sitio que quede online, revisá las condiciones de Riot para Personal/Production keys y registrá el producto cuando corresponda. Riot exige HTTPS y que las API keys permanezcan privadas.
