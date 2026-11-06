import type { MarketingAd } from '@/lib/types';

/** Ready-to-send mail drafts (no placeholders). */
export const SEED_MAIL_DRAFTS: MarketingAd[] = [
  {
    id: 'draft_welcome',
    title: '[MaterialLoop] Bun venit pe platformă',
    body: `Bună ziua,

Îți mulțumim că te-ai alăturat MaterialLoop — marketplace-ul pentru materiale de construcții și surplusuri.

Publică primul anunț din tab-ul Vinde și ajungi rapid la cumpărători din zonă.

Cu drag,
Echipa MaterialLoop
contact@materialloop.ro`,
    active: true,
    createdBy: null,
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'draft_listing_tip',
    title: '[MaterialLoop] Sfaturi pentru un anunț mai vizibil',
    body: `Bună ziua,

Pentru ca anunțul tău să atragă mai mulți cumpărători:
- adaugă 3–5 poze clare;
- scrie cantitatea, starea și locația de ridicare;
- setează un preț realist sau marchează „Gratuit” dacă oferi surplus.

Poți edita anunțul oricând din Vinde → Anunțurile mele.

Cu drag,
Echipa MaterialLoop
contact@materialloop.ro`,
    active: true,
    createdBy: null,
    createdAt: '2026-01-01T10:05:00.000Z',
    updatedAt: '2026-01-01T10:05:00.000Z',
  },
  {
    id: 'draft_offer',
    title: '[MaterialLoop] Ofertă săptămânală — materiale aproape de tine',
    body: `Bună ziua,

Săptămâna aceasta pe MaterialLoop găsești anunțuri noi de materiale aproape de tine: ciment, lemn, metal și altele.

Intră în aplicație, filtrează după județ și contactează vânzătorul direct din chat.

Cu drag,
Echipa MaterialLoop
contact@materialloop.ro`,
    active: true,
    createdBy: null,
    createdAt: '2026-01-01T10:10:00.000Z',
    updatedAt: '2026-01-01T10:10:00.000Z',
  },
  {
    id: 'draft_followup',
    title: '[MaterialLoop] Continuăm conversația despre anunț',
    body: `Bună ziua,

Îți scriem legat de anunțul pe care l-ai publicat sau de interesul tău pe MaterialLoop.

Dacă mai e valabil, răspunde pe email sau din mesajele aplicației ca să finalizăm detaliile (cantitate, preț, ridicare).

Cu drag,
Echipa MaterialLoop
contact@materialloop.ro`,
    active: true,
    createdBy: null,
    createdAt: '2026-01-01T10:15:00.000Z',
    updatedAt: '2026-01-01T10:15:00.000Z',
  },
  {
    id: 'draft_inactive',
    title: '[MaterialLoop] Te așteptăm înapoi',
    body: `Bună ziua,

Observăm că nu ai mai fost activ pe MaterialLoop de ceva timp. Au apărut anunțuri noi în zona ta.

Revino în aplicație când vrei să cumperi sau să vinzi surplusuri de materiale.

Cu drag,
Echipa MaterialLoop
contact@materialloop.ro`,
    active: true,
    createdBy: null,
    createdAt: '2026-01-01T10:20:00.000Z',
    updatedAt: '2026-01-01T10:20:00.000Z',
  },
];
