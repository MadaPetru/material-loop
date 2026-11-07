import { LEGAL_OPERATOR as op } from '@/lib/legal/operator';
import type { AppLocale } from '@/locales/types';

export type LegalDocId = 'privacy' | 'cookies' | 'terms' | 'safety';

export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalDocument = {
  id: LegalDocId;
  title: string;
  intro: string;
  sections: LegalSection[];
};

function docsRo(): Record<LegalDocId, LegalDocument> {
  return {
    privacy: {
      id: 'privacy',
      title: 'Politica de confidențialitate',
      intro: `Ultima actualizare: ${op.lastUpdated}. Operator: ${op.companyName}, CUI ${op.cui}, sediu ${op.address}, ${op.country}. Contact confidențialitate: ${op.privacyEmail}.`,
      sections: [
        {
          heading: '1. Cine suntem',
          paragraphs: [
            `${op.appName} este o platformă marketplace care conectează persoane și firme cu materiale de construcții rămase. Nu vindem noi materialele și nu procesăm plățile dintre utilizatori.`,
          ],
        },
        {
          heading: '2. Ce date prelucrăm',
          paragraphs: [
            'Date de cont: email, nume afișat, tip cont (persoană / firmă), parolă (stocată criptat de furnizorul de autentificare), opțional telefon verificat prin SMS.',
            'Date de profil și anunțuri: oraș, coordonate aproximative (cu jitter de confidențialitate), texte și fotografii pe care le publică, mesaje dintre cumpărători și vânzători.',
            'Date tehnice: tip dispozitiv / browser, jurnal de erori, preferințe de limbă și consimțământ cookie, IP la autentificare (prin furnizorul de autentificare).',
            'Dacă te autentifici cu Google, primim identificatorul și emailul pe care Google ni le pune la dispoziție, conform setărilor tale Google.',
          ],
        },
        {
          heading: '3. Temei și scopuri',
          paragraphs: [
            'Executarea contractului: crearea contului, publicarea anunțurilor, mesagerie, ștergerea contului.',
            'Interes legitim: securitate, prevenirea abuzurilor, îmbunătățirea produsului pe baza evenimentelor tehnice.',
            'Consimțământ: cookie-uri / SDK-uri opționale de analiză sau marketing (doar dacă le activezi în banner), și SMS de verificare telefon când soliciți acest lucru.',
            'Obligații legale: răspunsuri la cereri ale autorităților când legea o cere.',
          ],
        },
        {
          heading: '4. Destinatari',
          paragraphs: [
            'Furnizori care ne ajută să operăm platforma (de exemplu găzduire bază de date și autentificare tip Supabase, trimitere SMS dacă este activată, infrastructură de hosting web). Aceștia prelucrează datele doar pe instrucțiunile noastre.',
            'Alți utilizatori văd doar ce publici intenționat (profil, anunțuri, mesaje către ei). Adresele exacte nu trebuie publicate în anunț.',
          ],
        },
        {
          heading: '5. Transferuri și păstrare',
          paragraphs: [
            'Datele pot fi stocate pe servere din UE sau în afara UE, cu garanții adecvate (de exemplu clauze contractuale standard) atunci când e cazul.',
            'Păstrăm contul și anunțurile cât timp ești utilizator activ. După ștergerea contului, datele personale asociate sunt eliminate sau anonimizate în limitele tehnice și legale (backup-uri pe termen scurt pot exista).',
          ],
        },
        {
          heading: '6. Drepturile tale',
          paragraphs: [
            'Ai dreptul de acces, rectificare, ștergere, restricționare, opoziție, portabilitate (unde e aplicabil) și retragerea consimțământului pentru prelucrările bazate pe consimțământ.',
            `Poți șterge contul din aplicație (Profil). Pentru alte cereri GDPR scrie la ${op.privacyEmail}. Ai dreptul să te adresezi Autorității Naționale de Supraveghere a Prelucrării Datelor cu Caracter Personal (ANSPDCP).`,
          ],
        },
        {
          heading: '7. Minori',
          paragraphs: [
            'Serviciul nu este destinat persoanelor sub 18 ani. Nu colectăm în mod intenționat date de la minori.',
          ],
        },
      ],
    },
    cookies: {
      id: 'cookies',
      title: 'Politica de cookie-uri',
      intro: `Ultima actualizare: ${op.lastUpdated}. ${op.appName} folosește stocare locală și, pe web, cookie-uri / tehnologii similare.`,
      sections: [
        {
          heading: '1. Ce folosim',
          paragraphs: [
            'Necesare: sesiune de autentificare, preferință de limbă, alegerea ta de consimțământ. Fără acestea aplicația nu poate funcționa corect.',
            'Analiză (opțional): statistici de utilizare — încărcate doar dacă accepți categoria „Analiză”.',
            'Marketing (opțional): măsurare campanii / remarketing — doar dacă accepți categoria „Marketing”. În prezent nu încărcăm scripturi de marketing până nu le activăm explicit în produs.',
          ],
        },
        {
          heading: '2. Cum îți exprimi alegerea',
          paragraphs: [
            'La prima vizită (și oricând din această pagină) poți Accepta pe toate, Doar necesare sau Personalizează. Preferințele sunt salvate pe dispozitiv.',
            'Poți schimba alegerea oricând din „Gestionează preferințele” de pe această pagină sau din Profil.',
          ],
        },
        {
          heading: '3. Durată',
          paragraphs: [
            'Preferința de consimțământ rămâne până o resetezi. Sesiunea de autentificare urmează politica furnizorului de Auth. Poți șterge și datele site-ului din browser.',
          ],
        },
      ],
    },
    terms: {
      id: 'terms',
      title: 'Termeni și condiții',
      intro: `Ultima actualizare: ${op.lastUpdated}. Prin folosirea ${op.appName} accepti acești termeni.`,
      sections: [
        {
          heading: '1. Serviciul',
          paragraphs: [
            `${op.appName} este un marketplace care conectează persoane și firme care au materiale de construcții rămase cu cei care au nevoie de cantități mici. Platforma nu vinde materiale, nu intermediază plăți și nu garantează calitatea, starea sau legalitatea bunurilor listate.`,
            'Tranzacțiile, livrarea și plata se stabilesc direct între utilizatori.',
          ],
        },
        {
          heading: '2. Conturi',
          paragraphs: [
            'Trebuie să ai cel puțin 18 ani și să oferi informații corecte. Ești responsabil de securitatea contului și de conținutul pe care îl publică.',
            'Ne rezervăm dreptul de a suspenda sau șterge conturi care încalcă acești termeni sau legea.',
          ],
        },
        {
          heading: '3. Anunțuri și conduită',
          paragraphs: [
            'Este interzisă listarea materialelor periculoase neregulamentare, contrafăcute, furate sau care încalcă drepturi ale terților. Anunțurile cu chimicale, vopsele sau adezivi deschiși trebuie să includă starea și note de depozitare.',
            'Adresele exacte nu trebuie publicate în anunț; partajează-le doar în conversații private. Respectă și pagina de Siguranță materiale.',
          ],
        },
        {
          heading: '4. Răspundere',
          paragraphs: [
            'Platforma este oferită „ca atare”. Nu suntem parte la contractele dintre utilizatori și nu răspundem pentru dispute, daune materiale sau vătămări rezultate din tranzacții offline, în măsura permisă de lege.',
          ],
        },
        {
          heading: '5. Contact',
          paragraphs: [
            `Operator: ${op.companyName}, CUI ${op.cui}, ${op.address}. Email: ${op.privacyEmail}.`,
          ],
        },
      ],
    },
    safety: {
      id: 'safety',
      title: 'Siguranță materiale',
      intro: 'Reguli practice pentru listarea și preluarea materialelor de construcții.',
      sections: [
        {
          heading: 'Starea materialelor',
          paragraphs: [
            'Distinge clar între materiale noi neatins, ambalaj deschis, parțial folosite și recuperate. Pentru vopsele, adezivi și chimicale deschise, menționează condițiile de depozitare (temperatură, umiditate, data aproximativă a deschiderii).',
          ],
        },
        {
          heading: 'Ce nu listăm',
          paragraphs: [
            'Nu lista azbest, substanțe toxice neregulamentare, materiale radioactive sau produse furate. Raportează anunțurile suspecte din aplicație (Contact) sau pe email.',
          ],
        },
        {
          heading: 'Întâlniri',
          paragraphs: [
            'La întâlniri pentru ridicare, alege locuri publice când e posibil și verifică materialul înainte de plată.',
          ],
        },
      ],
    },
  };
}

function docsEn(): Record<LegalDocId, LegalDocument> {
  return {
    privacy: {
      id: 'privacy',
      title: 'Privacy policy',
      intro: `Last updated: ${op.lastUpdated}. Controller: ${op.companyName}, company ID ${op.cui}, registered office ${op.address}, ${op.country}. Privacy contact: ${op.privacyEmail}.`,
      sections: [
        {
          heading: '1. Who we are',
          paragraphs: [
            `${op.appName} is a marketplace that connects people and businesses that have leftover building materials with those who need small quantities. We do not sell the materials ourselves and we do not process payments between users.`,
          ],
        },
        {
          heading: '2. Data we process',
          paragraphs: [
            'Account data: email, display name, account type (individual / business), password (stored hashed by our auth provider), optional SMS-verified phone.',
            'Profile and listing data: city, approximate coordinates (with privacy jitter), texts and photos you publish, messages between buyers and sellers.',
            'Technical data: device / browser type, error logs, language and cookie-consent preferences, IP at sign-in (via the auth provider).',
            'If you sign in with Google, we receive the identifier and email Google shares with us under your Google settings.',
          ],
        },
        {
          heading: '3. Legal bases and purposes',
          paragraphs: [
            'Contract: creating an account, publishing listings, messaging, deleting your account.',
            'Legitimate interest: security, abuse prevention, product improvement from technical events.',
            'Consent: optional analytics or marketing cookies/SDKs (only if you enable them in the banner), and SMS phone verification when you request it.',
            'Legal obligation: responding to lawful authority requests.',
          ],
        },
        {
          heading: '4. Recipients',
          paragraphs: [
            'Processors that help us run the platform (for example database/auth hosting such as Supabase, SMS if enabled, web hosting). They process data only on our instructions.',
            'Other users only see what you intentionally publish (profile, listings, messages to them). Exact addresses must not be posted on listings.',
          ],
        },
        {
          heading: '5. Transfers and retention',
          paragraphs: [
            'Data may be stored in the EU or outside the EU with appropriate safeguards (such as standard contractual clauses) where required.',
            'We keep your account and listings while you are an active user. After account deletion, related personal data is removed or anonymised within technical and legal limits (short-lived backups may exist).',
          ],
        },
        {
          heading: '6. Your rights',
          paragraphs: [
            'You have rights of access, rectification, erasure, restriction, objection, portability (where applicable), and withdrawal of consent for consent-based processing.',
            `You can delete your account in the app (Profile). For other GDPR requests email ${op.privacyEmail}. You may lodge a complaint with the Romanian DPA (ANSPDCP).`,
          ],
        },
        {
          heading: '7. Children',
          paragraphs: [
            'The service is not directed at anyone under 18. We do not knowingly collect data from children.',
          ],
        },
      ],
    },
    cookies: {
      id: 'cookies',
      title: 'Cookie policy',
      intro: `Last updated: ${op.lastUpdated}. ${op.appName} uses local storage and, on web, cookies / similar technologies.`,
      sections: [
        {
          heading: '1. What we use',
          paragraphs: [
            'Necessary: auth session, language preference, your consent choice. The app cannot work properly without these.',
            'Analytics (optional): usage statistics — loaded only if you accept “Analytics”.',
            'Marketing (optional): campaign measurement / remarketing — only if you accept “Marketing”. We do not load marketing scripts until we enable them in the product.',
          ],
        },
        {
          heading: '2. How you choose',
          paragraphs: [
            'On first visit (and anytime from this page) you can Accept all, Necessary only, or Customize. Preferences are stored on your device.',
            'You can change your choice anytime via “Manage preferences” on this page or from Profile.',
          ],
        },
        {
          heading: '3. Duration',
          paragraphs: [
            'Consent preference lasts until you reset it. Auth session follows the auth provider policy. You can also clear site data in your browser.',
          ],
        },
      ],
    },
    terms: {
      id: 'terms',
      title: 'Terms of use',
      intro: `Last updated: ${op.lastUpdated}. By using ${op.appName} you agree to these terms.`,
      sections: [
        {
          heading: '1. The service',
          paragraphs: [
            `${op.appName} is a marketplace connecting people and businesses that have leftover building materials with those who need small quantities. The platform does not sell materials, does not intermediate payments, and does not guarantee quality, condition, or legality of listed goods.`,
            'Transactions, delivery, and payment are arranged directly between users.',
          ],
        },
        {
          heading: '2. Accounts',
          paragraphs: [
            'You must be at least 18 and provide accurate information. You are responsible for account security and the content you publish.',
            'We may suspend or delete accounts that violate these terms or the law.',
          ],
        },
        {
          heading: '3. Listings and conduct',
          paragraphs: [
            'Listing unlawful hazardous materials, counterfeits, stolen goods, or content that infringes third-party rights is forbidden. Listings with open chemicals, paints, or adhesives must include condition and storage notes.',
            'Do not post exact addresses on listings; share them only in private chat. Also follow the Material safety page.',
          ],
        },
        {
          heading: '4. Liability',
          paragraphs: [
            'The platform is provided “as is”. We are not a party to contracts between users and, to the extent allowed by law, are not liable for disputes, property damage, or injuries from offline transactions.',
          ],
        },
        {
          heading: '5. Contact',
          paragraphs: [
            `Operator: ${op.companyName}, ID ${op.cui}, ${op.address}. Email: ${op.privacyEmail}.`,
          ],
        },
      ],
    },
    safety: {
      id: 'safety',
      title: 'Material safety',
      intro: 'Practical rules for listing and picking up building materials.',
      sections: [
        {
          heading: 'Condition',
          paragraphs: [
            'Clearly distinguish new sealed, opened packaging, partially used, and reclaimed materials. For open paints, adhesives, and chemicals, state storage conditions (temperature, humidity, approximate open date).',
          ],
        },
        {
          heading: 'Do not list',
          paragraphs: [
            'Do not list asbestos, unlawful toxic substances, radioactive materials, or stolen goods. Report suspicious listings via Contact in the app or by email.',
          ],
        },
        {
          heading: 'Meet-ups',
          paragraphs: [
            'For pickups, prefer public places when possible and inspect materials before paying.',
          ],
        },
      ],
    },
  };
}

export function getLegalDocument(id: LegalDocId, locale: AppLocale): LegalDocument {
  return (locale === 'en' ? docsEn() : docsRo())[id];
}
