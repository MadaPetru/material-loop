import * as ExpoCrypto from 'expo-crypto';
import { Platform } from 'react-native';

declare const global: typeof globalThis & { crypto?: Crypto };

function resolveAlgorithm(algorithm: AlgorithmIdentifier): ExpoCrypto.CryptoDigestAlgorithm {
  const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
  return name as ExpoCrypto.CryptoDigestAlgorithm;
}

/**
 * Hermes / React Native lacks WebCrypto (`crypto.subtle`).
 * Supabase PKCE needs SHA-256; without it auth falls back to "plain" and Google login fails.
 */
export function ensureWebCryptoPolyfill() {
  if (Platform.OS === 'web') return;

  const existing = globalThis.crypto;
  const polyfilled = {
    getRandomValues:
      existing && typeof existing.getRandomValues === 'function'
        ? existing.getRandomValues.bind(existing)
        : ExpoCrypto.getRandomValues.bind(ExpoCrypto),
    randomUUID:
      existing && typeof existing.randomUUID === 'function'
        ? existing.randomUUID.bind(existing)
        : ExpoCrypto.randomUUID.bind(ExpoCrypto),
    subtle: {
      ...(existing?.subtle ?? {}),
      digest: (algorithm: AlgorithmIdentifier, data: BufferSource) =>
        ExpoCrypto.digest(resolveAlgorithm(algorithm), data),
    },
  } as Crypto;

  Object.defineProperty(globalThis, 'crypto', {
    value: polyfilled,
    configurable: true,
    writable: true,
  });
  // Hermes resolves bare `crypto` from the RN `global` object.
  global.crypto = polyfilled;
}

ensureWebCryptoPolyfill();
