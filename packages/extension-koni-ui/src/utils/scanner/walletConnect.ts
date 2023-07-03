// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { parseUri } from '@walletconnect/utils';

export const validWalletConnectUri = (data: string): string | null => {
  try {
    const { protocol, topic, version } = parseUri(data);

    if (version === 1) {
      return 'Not support WalletConnect v1';
    }

    if (protocol !== 'wc' || !topic) {
      return 'Invalid uri';
    }
  } catch (e) {
    console.error({ error: e });

    return (e as Error).message;
  }

  return null;
};
