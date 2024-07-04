// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ResponseMetadataHash, ResponseShortenMetadata } from '@subwallet/extension-base/types';

const LEDGER_API_URL = 'https://ledger-api.subwallet.app';

const createUrl = (path: string): string => `${LEDGER_API_URL}/${path}`;

export const _isRuntimeUpdated = (signedExtensions?: string[]): boolean => {
  return signedExtensions ? signedExtensions.includes('CheckMetadataHash') : false;
};

export const getMetadataHash = async (chain: string): Promise<string> => {
  const data = {
    id: chain
  };

  const resp = await fetch(createUrl('node/metadata/hash'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const rs = await resp.json() as ResponseMetadataHash;

  return rs.metadataHash;
};

export const getShortMetadata = async (chain: string, blob: string): Promise<string> => {
  const data = {
    chain: {
      id: chain
    },
    txBlob: blob
  };

  const resp = await fetch(createUrl('transaction/metadata'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const rs = await resp.json() as ResponseShortenMetadata;

  return rs.txMetadata;
};
