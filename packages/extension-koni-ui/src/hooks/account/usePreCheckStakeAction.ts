// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from 'react';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { useNotification, useTranslation } from '../common';
import useGetAccountByAddress from './useGetAccountByAddress';
import usePreCheckReadOnly from './usePreCheckReadOnly';

type VoidFunction = () => void;

const usePreCheckStakeAction = (address?: string): ((onClick: VoidFunction) => VoidFunction) => {
  const notify = useNotification();
  const { t } = useTranslation();

  const account = useGetAccountByAddress(address);
  const preCheckReadOnly = usePreCheckReadOnly(address);
  const isEthereum = isEthereumAddress(address);

  return useCallback((onClick: VoidFunction) => {
    return () => {
      if (account?.isHardware) {
        if (isEthereum) {
          notify({
            message: t('You are using a Ledger - EVM account. Staking is not supported with this account type'),
            type: 'info',
            duration: 1.5
          });

          return;
        }
      }

      preCheckReadOnly(onClick)();
    };
  }, [account?.isHardware, isEthereum, notify, preCheckReadOnly, t]);
};

export default usePreCheckStakeAction;
