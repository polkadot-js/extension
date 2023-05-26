// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import canonicalize from 'canonicalize';
import { z } from 'zod';

const ALGO = {
  hash: { name: 'SHA-512' },
  name: 'HMAC'
};

const signatureSchema = z.object({
  signatureMaterial: z.object({
    signature: z.string(),
    salt: z.string()
  })
});

type SignatureData = z.infer<typeof signatureSchema>

const encoder = new TextEncoder();

/**
 * WARNING! In case of modifications in this function, consider
 * backward compatibility of the JSONs that have already been exported
 * and should be possible to be imported after these changes.
 */
export const signJson = async <J extends object>(json: J, password: string): Promise<J & SignatureData> => {
  const canonicalJson = canonicalize(json);

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await generateKey(password, salt);
  const hmac = await crypto.subtle.sign(ALGO.name, key, encoder.encode(canonicalJson));

  return {
    ...json,
    signatureMaterial: {
      signature: bufferToBase64(hmac),
      salt: bufferToBase64(salt)
    }
  };
};

export const isJsonAuthentic = async (
  json: unknown,
  password: string
) => {
  const validationResult = signatureSchema.passthrough().safeParse(json);

  const isSignedJson = validationResult.success;

  if (!isSignedJson) {
    return false;
  }

  const { signatureMaterial: { salt, signature }, ...accountJson } = validationResult.data;

  const canonicalJson = canonicalize(accountJson);

  const key = await generateKey(password, base64ToBuffer(salt));

  return crypto.subtle.verify(
    ALGO.name,
    key,
    base64ToBuffer(signature),
    encoder.encode(canonicalJson)
  );
};

const generateKey = async (password: string, salt: Uint8Array) => {
  const initialKeyMaterial = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits', 'deriveKey']);

  return crypto.subtle.deriveKey({
    name: 'PBKDF2',
    salt,
    iterations: 210_000, // As per the recommendation: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#pbkdf2
    hash: 'SHA-512'
  }, initialKeyMaterial, ALGO, false, ['sign', 'verify']);
};

const bufferToBase64 = (buffer: ArrayBufferLike) => self.btoa(String.fromCharCode(...new Uint8Array(buffer)));
const base64ToBuffer = (base64: string) => Uint8Array.from(self.atob(base64), (c) => c.charCodeAt(0));
