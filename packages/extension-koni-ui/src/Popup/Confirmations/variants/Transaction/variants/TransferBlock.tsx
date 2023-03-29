// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicDataTypeMap, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = ({ transaction }: Props) => {
  const { t } = useTranslation();
  const data = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_BALANCE];
  const xcmData = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_XCM];
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const tokenInfo = assetRegistryMap[data.tokenSlug];

  const chainInfo = useMemo(
    () => (data.networkKey ? chainInfoMap[transaction.chain] : null),
    [chainInfoMap, data.networkKey, transaction.chain]
  );

  return (
    <>
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Account
          address={data.from}
          label={t('Sender')}
        />

        {transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM && chainInfo && <MetaInfo.Chain
          chain={chainInfo.slug}
          label={t('Sender Network')}
        />}

        <MetaInfo.Account
          address={data.to}
          label={t('Recipient')}
        />

        {transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM && chainInfo && <MetaInfo.Chain
          chain={xcmData.destinationNetworkKey}
          label={t('Recipient Network')}
        />}

        {transaction.extrinsicType !== ExtrinsicType.TRANSFER_XCM && chainInfo && <MetaInfo.Chain
          chain={chainInfo.slug}
          label={t('Network')}
        />}
      </MetaInfo>

      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Number
          decimals={tokenInfo.decimals || 18}
          label={t('Amount')}
          suffix={tokenInfo.symbol}
          value={data.value || 0}
        />

        <MetaInfo.Number
          decimals={chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals || 18}
          label={t('Estimated fee')}
          suffix={chainInfo?.substrateInfo?.symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </>
  );
};

export const TransferBlock = styled(Component)<Props>(({ theme: { token } }) => {
  return {};
});
