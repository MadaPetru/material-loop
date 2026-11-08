# MaterialLoop

Marketplace pentru materiale de construcții rămase — cumpără, vinde sau oferă gratuit, în toată România.

Aplicație **web + mobil** pe un singur codebase: **Expo (React Native) + Expo Router**, cu backend țintă **Supabase**.

## Ce există în v1 (Phase 1)

- Autentificare email/parolă (demo local) + buton Google (activ după credențiale)
- Profil utilizator (locație pe județ/localitate, fără adresă exactă publică; telefon mobil cu verificare SMS)
- Categorii ierarhice de materiale
- Creare / editare / status anunțuri (draft, activ, rezervat, vândut, oferit, șters)
- Fotografii multiple, cantități zecimale, gratuit / negociabil
- Căutare națională: text, categorie, județ, localitate, rază, doar gratuite
- Favorite, pagină detaliu, profil vânzător
- Termeni & siguranță
- Schema SQL România-wide (țară → județ → localitate) pregătită pentru Supabase

Mesagerie, review-uri, admin, hartă interactivă: etapele următoare.

## Rulare locală

```bash
npm install
npm run web          # http://localhost:8081
npm start            # Expo Go pe telefon
```

Fără variabile Supabase, aplicația pornește în **mod demonstrație** (date pe dispozitiv).

Cont demo: `demo@materialloop.ro` / `demo1234`  
Cont admin demo: `admin@materialloop.ro` / `demo1234` (tab **Admin**)

## Publicare — GDPR / legal

Înainte de lansare publică:

1. Completează identitatea operatorului în `lib/legal/operator.ts` (`companyName`, `cui`, `address`).
2. Verifică paginile `/legal/privacy`, `/legal/cookies`, `/legal/terms`, `/legal/safety` (EN + RO) pe web: `https://materialloop.website/legal/privacy`.
3. Bannerul de cookie-uri apare la prima vizită; preferințele se pot redeschide din Profil sau din Politica de cookie-uri.
4. Ștergerea contului există deja în Profil (cerință store / GDPR).

## Publicare Google Play (EAS)

Config: `eas.json` (profil `production` → `.aab`) + `app.json` (`ro.materialloop.app`).

```bash
npx eas-cli login
npx eas-cli init                 # setează projectId real în app.json
npx eas-cli build --platform android --profile production
npx eas-cli submit --platform android --latest
```

Checklist Play Console (în afara repo-ului):

1. Cont developer verificat + app creată cu package `ro.materialloop.app`
2. Store listing: titlu, descriere scurtă/lungă, screenshot-uri telefon, icon 512
3. Privacy policy URL: `https://materialloop.website/legal/privacy`
4. Data safety: location, photos, account info (app-collected, not sold)
5. Ads: **No** (AD_ID e blocat în `app.json`)
6. Content rating + target audience
7. Prima încărcare pe track **Internal testing** / draft (vezi `eas.json` → submit.production)

## Conectare Supabase

1. Creează un proiect pe [supabase.com](https://supabase.com) (sau folosește cel legat).
2. Aplică migrările: `npx supabase link --project-ref <ref>` apoi `npx supabase db push --linked`.
3. Copiază URL + anon key în `.env`:

```bash
cp .env.example .env
```

4. Reactivează aplicația. Cu `EXPO_PUBLIC_SUPABASE_*` setate, Auth + anunțuri folosesc cloud-ul (nu demo local).
5. Pentru un **feed de anunțuri-exemplu** (surplus / leftover) până apar vânzători reali: aplică migrarea `017_seed_sample_flags.sql`, apoi rulează (service role):

```bash
# PowerShell
$env:SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
npm run seed:samples
```

`seed:samples` regenerează catalogul pe județe (`data/seed-county.catalog.json`: 1–3 anunțuri/județ) plus catalogul Bihor, creează **utilizatori fake** (`profiles.is_seed`) și anunțuri **deja oferite** (`sold` / `given_away`, `is_seed=true`).

Fake-urile **apar în Home/Search** ca „Exemplu / deja oferit”, dar **contactul e dezactivat**. Anunțurile reale `sold`/`given_away` **nu** apar în feed (doar cele `active`). În Admin vezi clar fake vs reali. Ștergere ulterioară:

```sql
delete from listing_photos where listing_id in (select id from listings where is_seed);
delete from listings where is_seed;
delete from profiles where is_seed;
-- apoi șterge userii Auth seed din Dashboard dacă e nevoie
```

6. Pentru **WhatsApp săptămânal cu statistici** (gratis, fără SMTP — [CallMeBot](https://www.callmebot.com/blog/free-api-whatsapp-messages/)):
   1. Adaugă în contacte numărul CallMeBot și trimite mesajul de activare (vezi ghidul de pe site) — primești un `apikey`.
   2. Deploy: `npx supabase functions deploy stats-email --no-verify-jwt`
   3. Setează secrets (telefon în format internațional, fără `+`, ex. `407xxxxxxxx`):

```bash
npx supabase secrets set STATS_CRON_SECRET=long-random CALLMEBOT_PHONE=407xxxxxxxx CALLMEBOT_APIKEY=your_apikey
```

   - Test manual:

```bash
curl -X POST "$env:EXPO_PUBLIC_SUPABASE_URL/functions/v1/stats-email" -H "x-stats-cron-secret: YOUR_SECRET"
```

   - Programează săptămânal (luni ~07:00 Europe/Bucharest): Supabase Dashboard → Edge Functions → `stats-email` → Schedules, cron `0 5 * * 1` (05:00 UTC), header `x-stats-cron-secret`.
   - În Admin, **Vândute / Oferite gratuit** numără doar anunțurile **reale** (fără seed).

7. Pentru **verificare telefon (SMS)**: Authentication → Providers → Phone → activează un provider SMS (Twilio / MessageBird etc.). Fără SMS provider, OTP-ul nu ajunge pe telefon real; în **mod demo** folosește codul `123456`.
8. Pentru **ștergere cont** (hard delete Auth): deploy Edge Function-ul din repo:
   `npx supabase functions deploy delete-account`
   (necesită proiect link-uit). Fără el, app-ul face un soft-delete (profil dezactivat + anunțuri ascunse) și te deconectează.
9. Pentru **roluri / admin** pe Supabase: aplică migrările `008`–`013` (catalog `roles` + ads marketing), apoi:
   `update profiles set roles = array['user','admin'] where email = 'you@example.com';`
   Rolurile și entitlement-urile se editează din panoul Admin → Roles.
   Accesul UI/API se controlează prin **entitlements** acțiune-cu-acțiune (`lib/entitlements.ts`).

## Deploy web (Vercel)

Supabase găzduiește Auth/DB; UI-ul Expo web se publică pe Vercel.

1. În Vercel → Project → Settings → Environment Variables, setează:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
2. Deploy: `npx vercel --prod` (sau conectează repo-ul în dashboard).
3. În Supabase → Authentication → URL Configuration, adaugă originile din Google Console la Redirect URLs (vezi secțiunea Google Sign-In).

Build local: `npm run export:web` → folder `dist/`.

---

## Google Sign-In — ce îmi dai, când și cum obții credențialele

Nu ai nevoie de Google acum ca să rulezi v1. Activează Google **după** ce ai un proiect Supabase.

### Ce îmi (sau proiectului) trebuie

| Valoare | Unde se pune | Cine o vede |
| --- | --- | --- |
| **Google Client ID** (Web) | Supabase → Authentication → Providers → Google | Admin Supabase |
| **Google Client Secret** | Același ecran Supabase (secret) | Doar tu / Supabase |
| Opțional: iOS Client ID / Android Client ID | Google Cloud + Expo `app.json` | Pentru store builds native |

**Nu** pune Client Secret în repo, în `.env` public, sau în chat. Secretul rămâne doar în dashboard-ul Supabase.

După ce le configurezi în Supabase, spune-mi doar: „Google e activ în Supabase” — nu e nevoie să trimiți secretul aici. Dacă vrei verificare, poți partaja **doar Client ID-ul Web** (nu secretul).

### Cum le obții (pas cu pas)

1. **Deschide Google Cloud Console**  
   [https://console.cloud.google.com/](https://console.cloud.google.com/)  
   Creează un proiect (ex. `MaterialLoop`) sau folosește unul existent.

2. **Configurează ecranul OAuth consent**  
   APIs & Services → **OAuth consent screen**  
   - Tip: **External** (sau Internal dacă e Google Workspace)  
   - App name: `MaterialLoop`  
   - User support email: emailul tău  
   - Authorized domains: adaugă `supabase.co`  
   - Scopes: `email`, `profile`, `openid`  
   - Adaugă-ți emailul ca test user cât timp app-ul e în Testing

3. **Creează OAuth Client ID de tip Web application**  
   APIs & Services → **Credentials** → Create credentials → **OAuth client ID**  
   - Application type: **Web application**  
   - Name: `MaterialLoop Supabase`  
   - **Authorized JavaScript origins** (cele din Google Console acum):  
     - `http://localhost:8081`  
     - `https://materialloop.vercel.app`  
     - `https://materialloop.website`  
     - `https://www.materialloop.website`  
   - **Authorized redirect URIs** (obligatoriu pe lângă originile de mai sus):  
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`  
   Copiază **Client ID** și **Client Secret**.

4. **Lipește-le în Supabase**  
   Supabase Dashboard → **Authentication** → **Providers** → **Google** → Enable  
   - Client ID = cel din pasul 3  
   - Client Secret = cel din pasul 3  
   Salvează.

5. **Redirect URL-uri în Supabase** (obligatoriu — trebuie să oglindească originile din Google Console)  
   Dashboard → **Authentication** → **URL Configuration**  
   - **Site URL** (prod): `https://materialloop.website`  
   - **Redirect URLs** (adaugă toate):
     - `http://localhost:8081/**`
     - `https://materialloop.vercel.app/**`
     - `https://materialloop.website/**`
     - `https://www.materialloop.website/**`
     - `materialloop://**`
     - `exp://**` (obligatoriu pentru Google login în Expo Go)

   Fără `exp://**`, pe telefon Google se deschide dar app-ul rămâne pe „Se deschide Google…” (redirect-ul înapoi e blocat).

   App-ul trimite `redirectTo`:
   - Web: `{origin}/login` (ex. `http://localhost:8081/login`, `https://materialloop.website/login`)
   - Native (build): `materialloop://login`
   - Expo Go: URI `exp://IP:8081/--/login` (vezi și log-ul `[auth] Google OAuth redirectTo =` în Metro)

6. **(Opțional, pentru iOS/Android store)**  
   Creează și clienți OAuth **iOS** / **Android** în Google Cloud, cu bundle id / package name din `app.json`, apoi configurează-le în Expo / Supabase conform [docs Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google).
   Flow-ul actual din app folosește **browser OAuth** (`signInWithOAuth` + `expo-web-browser`), nu SDK-ul nativ Google — Client ID **Web** din Supabase este suficient pentru web + native deep link.

### Când să faci asta

| Moment | Acțiune |
| --- | --- |
| Acum | Rulează demo-ul, testează marketplace-ul |
| Ai creat proiectul Supabase | Rulează migrarea SQL + `.env` |
| Vrei butonul „Continuă cu Google” live | Pașii Google de mai sus |
| Pregătești build store | Adaugă clienții iOS/Android |

---

## Structură

```
app/                 # ecrane Expo Router (web + mobil)
components/          # UI + listing cards
contexts/            # Auth
data/                # categorii + geo România
lib/api/             # marketplace API (demo local sau Supabase)
supabase/migrations/ # SQL
```

## Monetizare

MVP fără plăți. Schema permite featured listings / business accounts mai târziu, fără redesign.

## Licență

Vezi `LICENSE`.
