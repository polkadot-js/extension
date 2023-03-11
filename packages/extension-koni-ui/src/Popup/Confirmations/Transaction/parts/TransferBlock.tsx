// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { TransferData } from '@subwallet/extension-koni-ui/Popup/Confirmations/Transaction/type';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps & {
  transactionResult: SWTransactionResult
};

const Component: React.FC<Props> = ({ transactionResult }: Props) => {
  const { t } = useTranslation();
  const data = transactionResult.data as TransferData;
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const symbol = assetRegistryMap[data.tokenSlug].symbol;

  const chainInfo = useMemo(
    () => (data.networkKey ? chainInfoMap[data.networkKey] : null),
    [chainInfoMap, data.networkKey]
  );

  return (
    <>
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Account
          address={data.from}
          label={t('Sender')}
        />

        <MetaInfo.Account
          address={data.to}
          label={t('Recipient')}
        />
      </MetaInfo>

      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals || 18}
          label={t('Amount')}
          suffix={symbol}
          value={data.value || 0}
        />

        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals || 18}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transactionResult.estimateFee?.value || 0}
        />
      </MetaInfo>
    </>
  );
};

export const TransferBlock = styled(Component)<Props>(({ theme: { token } }) => {
  return {};
});
