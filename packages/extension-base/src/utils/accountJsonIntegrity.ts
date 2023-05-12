// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import canonicalize from 'canonicalize';

const ALGO = {
  hash: { name: 'SHA-512' },
  name: 'HMAC'
};

const encoder = new TextEncoder();

/**
 * WARNING! In case of modifications in this function, consider
 * backward compatibility of the JSONs that have already been exported
 * and should be possible to be imported after these changes.
 */
export const signJson = async <J extends object>(json: J, password: string): Promise<J & { signature: string }> => {
  const canonicalJson = canonicalize(json);

  const key = await generateKey(password);
  const hmac = await crypto.subtle.sign(ALGO.name, key, encoder.encode(canonicalJson));

  return {
    ...json,
    signature: self.btoa(String.fromCharCode(...new Uint8Array(hmac)))
  };
};

export const isJsonAuthentic = async (
  json: unknown,
  password: string
) => {
  if (!isSignedJson(json)) {
    return false;
  }

  const { signature, ...accountJson } = json;

  const canonicalJson = canonicalize(accountJson);

  const key = await generateKey(password);

  return crypto.subtle.verify(
    ALGO.name,
    key,
    Uint8Array.from(self.atob(signature), (c) => c.charCodeAt(0)),
    encoder.encode(canonicalJson)
  );
};

const generateKey = (password: string) =>
  crypto.subtle.importKey('raw', encoder.encode(password), ALGO, false, ['sign', 'verify']);

const isSignedJson = (json: unknown): json is { signature: string } =>
  typeof json === 'object' && json !== null && 'signature' in json;
