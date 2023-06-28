// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const validWalletConnectUri = (data: string): boolean => {
  if (!data.startsWith('wc:')) {
    return false;
  }

  return true;
};
