/** Map technical / API errors to clear Romanian user copy. */

export const USER_COPY = {
  unknown: 'A apărut o eroare. Încearcă din nou.',
  saveListingFailed: 'Nu am putut salva anunțul. Verifică câmpurile și încearcă din nou.',
  invalidCity: 'Alege o localitate validă din listă.',
  googleInterrupted: 'Autentificarea Google a fost anulată.',
  deleteConfirmTitle: 'Ștergi anunțul?',
  deleteConfirmBody: 'Anunțul va fi ascuns din căutare. Poți publica altul oricând.',
} as const;

const PATTERNS: Array<{ test: RegExp; message: string }> = [
  {
    test: /invalid login credentials|email sau parol[aă] incorrect/i,
    message: 'Email sau parolă greșită. Verifică datele sau resetează parola.',
  },
  {
    test: /email.*already|already.*registered|user already|Există deja un cont/i,
    message: 'Există deja un cont cu acest email. Încearcă să te autentifici.',
  },
  {
    test: /password.*(weak|short|at least|least 6)/i,
    message: 'Parola trebuie să aibă cel puțin 6 caractere.',
  },
  {
    test: /network|fetch failed|failed to fetch|timeout/i,
    message: 'Problema de conexiune. Verifică internetul și încearcă din nou.',
  },
  {
    test: /email not confirmed|confirm.*(email|signup)/i,
    message: 'Confirmă adresa de email din inbox, apoi autentifică-te.',
  },
  {
    test: /redirect url|redirect_uri|oauth.*cancel|access_denied|întrerupt/i,
    message: 'Autentificarea Google a fost întreruptă sau redirect-ul nu e permis.',
  },
  {
    test: /EXPO_PUBLIC_SUPABASE|necesită Supabase|vezi README|nu este configurat/i,
    message: 'Conectarea cu Google nu e disponibilă momentan. Folosește email și parolă.',
  },
  {
    test: /row.level.security|permission denied|violates/i,
    message: 'Nu ai permisiunea pentru această acțiune. Autentifică-te din nou.',
  },
  {
    test: /rate.?limit|too many requests/i,
    message: 'Prea multe încercări. Așteaptă un moment și încearcă din nou.',
  },
];

export function toUserError(error: unknown, fallback: string = USER_COPY.unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : fallback;

  for (const { test, message } of PATTERNS) {
    if (test.test(raw)) return message;
  }

  if (raw.length <= 140 && !/stack|at Object\.|supabase\.co|jwt/i.test(raw)) {
    return raw;
  }

  return 'Nu am putut finaliza acțiunea. Încearcă din nou peste câteva secunde.';
}
