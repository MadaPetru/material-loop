-- Seed ready-to-send mail drafts (no placeholders).

insert into public.marketing_ads (id, title, body, active, created_by, created_at, updated_at)
values
  (
    'a1000000-0000-4000-8000-000000000001',
    '[MaterialLoop] Bun venit pe platformă',
    E'Bună ziua,\n\nÎți mulțumim că te-ai alăturat MaterialLoop — marketplace-ul pentru materiale de construcții și surplusuri.\n\nPublică primul anunț din tab-ul Vinde și ajungi rapid la cumpărători din zonă.\n\nCu drag,\nEchipa MaterialLoop\ncontact@materialloop.ro',
    true,
    null,
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000002',
    '[MaterialLoop] Sfaturi pentru un anunț mai vizibil',
    E'Bună ziua,\n\nPentru ca anunțul tău să atragă mai mulți cumpărători:\n- adaugă 3–5 poze clare;\n- scrie cantitatea, starea și locația de ridicare;\n- setează un preț realist sau marchează „Gratuit” dacă oferi surplus.\n\nPoți edita anunțul oricând din Vinde → Anunțurile mele.\n\nCu drag,\nEchipa MaterialLoop\ncontact@materialloop.ro',
    true,
    null,
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000003',
    '[MaterialLoop] Ofertă săptămânală — materiale aproape de tine',
    E'Bună ziua,\n\nSăptămâna aceasta pe MaterialLoop găsești anunțuri noi de materiale aproape de tine: ciment, lemn, metal și altele.\n\nIntră în aplicație, filtrează după județ și contactează vânzătorul direct din chat.\n\nCu drag,\nEchipa MaterialLoop\ncontact@materialloop.ro',
    true,
    null,
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000004',
    '[MaterialLoop] Continuăm conversația despre anunț',
    E'Bună ziua,\n\nÎți scriem legat de anunțul pe care l-ai publicat sau de interesul tău pe MaterialLoop.\n\nDacă mai e valabil, răspunde pe email sau din mesajele aplicației ca să finalizăm detaliile (cantitate, preț, ridicare).\n\nCu drag,\nEchipa MaterialLoop\ncontact@materialloop.ro',
    true,
    null,
    now(),
    now()
  ),
  (
    'a1000000-0000-4000-8000-000000000005',
    '[MaterialLoop] Te așteptăm înapoi',
    E'Bună ziua,\n\nObservăm că nu ai mai fost activ pe MaterialLoop de ceva timp. Au apărut anunțuri noi în zona ta.\n\nRevino în aplicație când vrei să cumperi sau să vinzi surplusuri de materiale.\n\nCu drag,\nEchipa MaterialLoop\ncontact@materialloop.ro',
    true,
    null,
    now(),
    now()
  )
on conflict (id) do update set
  title = excluded.title,
  body = excluded.body,
  active = excluded.active,
  updated_at = now();
