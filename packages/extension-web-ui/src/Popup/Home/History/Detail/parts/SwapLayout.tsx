// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetName, _getAssetOriginChain } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapTxData } from '@subwallet/extension-base/types/swap';
import { AlertBox, MetaInfo } from '@subwallet/extension-web-ui/components';
import SwapTransactionBlock from '@subwallet/extension-web-ui/components/Swap/SwapTransactionBlock';
import { HistoryStatusMap, TxTypeNameMap } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, data } = props;
  const { t } = useTranslation();
  const assetRegistry = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const swapInfo = data.additionalInfo as SwapTxData | undefined;

  if (!swapInfo) {
    return (
      <></>
    );
  }

  const assetFrom = assetRegistry[swapInfo.quote.pair.from];
  const assetTo = assetRegistry[swapInfo.quote.pair.to];
  const recipientAddress = data.to || swapInfo.recipient as string;

  return (
    <MetaInfo className={CN(className)}>
      <SwapTransactionBlock
        data={swapInfo}
      />
      <MetaInfo.Transfer
        destinationChain={{
          slug: _getAssetOriginChain(assetTo),
          name: _getAssetName(assetTo)
        }}
        originChain={{
          slug: _getAssetOriginChain(assetFrom),
          name: _getAssetName(assetFrom)
        }}
        recipientAddress={recipientAddress}
        recipientName={data.toName}
        senderAddress={data.from}
        senderName={data.fromName}
      />
      <MetaInfo.DisplayType
        label={t('Transaction type')}
        typeName={t(TxTypeNameMap[data.type])}
      />
      <MetaInfo.Status
        className={CN('__transaction-status')}
        label={t('Transaction status')}
        statusIcon={HistoryStatusMap[data.status].icon}
        statusName={t(HistoryStatusMap[data.status].name)}
        valueColorSchema={HistoryStatusMap[data.status].schema}
      />
      <>
        <MetaInfo.Number
          className={'__estimate-transaction-fee'}
          decimals={data.fee?.decimals}
          label={'Estimated transaction fee'}
          prefix={'$'}
          value={data.fee?.value || 0}
        />
        <AlertBox
          className={'__swap-quote-warning'}
          description={t('You can view detailed transaction progress on explorer')}
          title={t('Warning!')}
          type='warning'
        />
      </>

    </MetaInfo>
  );
};

const SwapLayout = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__estimate-transaction-fee.__row': {
      marginTop: 12
    },
    '.__transaction-status.__row': {
      marginTop: 12
    },
    '.__swap-quote-warning': {
      marginTop: 16,
      marginBottom: -16
    }
  };
});

export default SwapLayout;
