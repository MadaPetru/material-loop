/** Strip cold-start boilerplate so seed inventory reads like real listings. */
const SEED_NOISE =
  /anun[țt] exemplu[^.!?\n]*[.!?]?|listare (?:exemplu|seed|demonstrativ[ăa])[^.!?\n]*[.!?]?|contactul este dezactivat[^.!?\n]*[.!?]?|materialloop seed inventory[^.!?\n]*[.!?]?|doar pentru popularea feed-ului[^.!?\n]*[.!?]?|stoc demonstrativ[^.!?\n]*[.!?]?|deja ofertat[ăa] \/ încheiat[ăa] \(seed\)[^.!?\n]*[.!?]?|cont exemplu[^.!?\n]*[.!?]?|nu prelua comenzi reale[^.!?\n]*[.!?]?/gi;

export function publicFacingText(text: string | null | undefined, isSeed?: boolean) {
  if (!text) return '';
  if (!isSeed) return text;
  return text
    .replace(SEED_NOISE, ' ')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!])/g, '$1')
    .trim();
}
