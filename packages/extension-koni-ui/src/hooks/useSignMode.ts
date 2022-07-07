// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {AccountJson} from '@subwallet/extension-base/background/types';
import { SIGN_MODE } from '@subwallet/extension-koni-ui/constants/signing';
import { useMemo } from 'react';

import { KeyringPair$Meta } from '@polkadot/keyring/types';

export const useSignMode = (account?: KeyringPair$Meta | AccountJson | null) => {
  const signMode = useMemo((): SIGN_MODE => {
    if (!account) {
      return SIGN_MODE.PASSWORD;
    }

    if (account.isExternal && !!account.isExternal) {
      if (account.isHardware && !!account.isHardware) {
        return SIGN_MODE.LEDGER;
      }

      return SIGN_MODE.QR;
    }

    return SIGN_MODE.PASSWORD;
  }, [account]);

  return signMode;
};
