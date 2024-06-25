// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicDataTypeMap, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import MetaInfo from '@subwallet/extension-koni-ui/components/MetaInfo/MetaInfo';
import { useGetChainPrefixBySlug, useGetNativeTokenBasicInfo } from '@subwallet/extension-koni-ui/hooks';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className, transaction } = props;
  const data = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.SEND_NFT];

  const { t } = useTranslation();

  const { decimals, symbol } = useGetNativeTokenBasicInfo(transaction.chain);
  const networkPrefix = useGetChainPrefixBySlug(transaction.chain);

  return (
    <div className={CN(className)}>
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Account
          address={data.senderAddress}
          label={t('Send from')}
          networkPrefix={networkPrefix}
        />

        <MetaInfo.Account
          address={data.recipientAddress}
          label={t('Send to')}
          networkPrefix={networkPrefix}
        />

        <MetaInfo.Chain
          chain={transaction.chain}
          label={t('Network')}
        />
      </MetaInfo>
      <MetaInfo hasBackgroundWrapper={true}>
        {
          !!(data.nftItemName || data.nftItem) && (
            <MetaInfo.Default label={t('NFT')}>
              {data.nftItemName || data.nftItem.name || data.nftItem.id}
            </MetaInfo.Default>
          )
        }
        <MetaInfo.Number
          decimals={decimals}
          label={t('Estimated fee')}
          suffix={symbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
    </div>
  );
};

const SendNftTransactionConfirmation = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {};
});

export default SendNftTransactionConfirmation;
