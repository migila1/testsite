# Mijn Uitgaven

Persoonlijke PWA om ING-banktransacties te importeren, categoriseren en analyseren.

## Lokaal

```bash
cp .env.example .env.local
npm ci
npm run dev
```

Zonder Supabase (of met `VITE_DEMO=true`) gebruikt de app localStorage — **geen login**. Met Supabase URL + anon key is **e-mail/wachtwoord login** verplicht (Auth in Supabase Dashboard inschakelen). `VITE_DEMO_SEED=true` vult voorbeelddata in demo-modus.

## Tests & build

```bash
npm test
npm run build
$env:PW_CHANNEL='msedge'; npx playwright test
```

## Coolify

- Build: `npm ci` → `npm run build`
- Publish directory: `dist`
- Zet `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (en optioneel demo-flags) als build-variabelen
- HTTPS verplicht voor PWA/service worker

## Supabase

Voer `supabase/schema.sql` uit in je project (nieuw project). Bestaand project: draai extra scripts in **SQL Editor**, bv. `supabase/migration_category_adjustments.sql` voor eenmalige categorie-bedragen op het dashboard. Alle tabellen hebben RLS op `user_id = auth.uid()`.
