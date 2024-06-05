// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseShortenMetadata } from '@subwallet/extension-koni-ui/types';
import fetch from 'cross-fetch';

export const getShortMetadata = async (chain: string, blob: string): Promise<string> => {
  const data = {
    chain: {
      id: chain
    },
    txBlob: blob
  };

  const resp = await fetch('https://ledger-api.subwallet.app/transaction/metadata', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const rs = await resp.json() as ResponseShortenMetadata;

  return rs.txMetadata;
};
