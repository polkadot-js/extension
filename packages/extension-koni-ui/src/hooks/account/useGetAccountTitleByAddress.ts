// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useGetAccountSignModeByAddress } from '@subwallet/extension-koni-ui/hooks';
import { AccountSignMode } from '@subwallet/extension-koni-ui/types';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { isEthereumAddress } from '@polkadot/util-crypto';

const useGetAccountTitleByAddress = (address?: string): string => {
  const { t } = useTranslation();

  const signMode = useGetAccountSignModeByAddress(address);
  const isEvm = useMemo(() => isEthereumAddress(address || ''), [address]);

  return useMemo((): string => {
    switch (signMode) {
      case AccountSignMode.LEGACY_LEDGER:
      case AccountSignMode.GENERIC_LEDGER:
        return t('Ledger account');
      case AccountSignMode.ALL_ACCOUNT:
        return t('All account');
      case AccountSignMode.PASSWORD:
        return t('Normal account');

      case AccountSignMode.QR:
        if (isEvm) {
          return t('EVM QR signer account');
        } else {
          return t('Substrate QR signer account');
        }

      case AccountSignMode.READ_ONLY:
        return t('Watch-only account');
      case AccountSignMode.UNKNOWN:
      default:
        return t('Unknown account');
    }
  }, [signMode, t, isEvm]);
};

export default useGetAccountTitleByAddress;
