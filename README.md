# MaterialLoop

Marketplace pentru materiale de construcții rămase — cumpără, vinde sau oferă gratuit, în toată România.

Aplicație **web + mobil** pe un singur codebase: **Expo (React Native) + Expo Router**, cu backend țintă **Supabase**.

## Ce există în v1 (Phase 1)

- Autentificare email/parolă (demo local) + buton Google (activ după credențiale)
- Profil utilizator (locație pe județ/localitate, fără adresă exactă publică)
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
npm run web          # http://127.0.0.1:43127
npm start            # Expo Go pe telefon
```

Fără variabile Supabase, aplicația pornește în **mod demonstrație** (date pe dispozitiv).

Cont demo: `demo@materialloop.ro` / `demo1234`

## Conectare Supabase (când ești gata)

1. Creează un proiect pe [supabase.com](https://supabase.com).
2. Rulează SQL din [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) (și seed-ul de categorii/județe din app — sau importă din `data/`).
3. Copiază URL + anon key în `.env`:

```bash
cp .env.example .env
```

4. Reactivează aplicația. Clientul Supabase se leagă prin `EXPO_PUBLIC_SUPABASE_*`.

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
   - **Authorized JavaScript origins**  
     - `https://YOUR_PROJECT_REF.supabase.co`  
     - `http://127.0.0.1:43127` (dev web)  
   - **Authorized redirect URIs** (important):  
     - `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`  
   Copiază **Client ID** și **Client Secret**.

4. **Lipește-le în Supabase**  
   Supabase Dashboard → **Authentication** → **Providers** → **Google** → Enable  
   - Client ID = cel din pasul 3  
   - Client Secret = cel din pasul 3  
   Salvează.

5. **Redirect URL-uri în Supabase**  
   Authentication → URL Configuration  
   - Site URL: `http://127.0.0.1:43127` (dev) / domeniul tău (prod)  
   - Redirect URLs: `http://127.0.0.1:43127/**`, `materialloop://**`, URL-ul de producție

6. **(Opțional, pentru iOS/Android store)**  
   Creează și clienți OAuth **iOS** / **Android** în Google Cloud, cu bundle id / package name din `app.json`, apoi configurează-le în Expo / Supabase conform [docs Supabase Google](https://supabase.com/docs/guides/auth/social-login/auth-google).

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
lib/api/             # marketplace API (demo acum; Supabase mai târziu)
supabase/migrations/ # SQL
```

## Monetizare

MVP fără plăți. Schema permite featured listings / business accounts mai târziu, fără redesign.

## Licență

Vezi `LICENSE`.
