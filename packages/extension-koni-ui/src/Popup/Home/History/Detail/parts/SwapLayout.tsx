// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetName, _getAssetOriginChain } from '@subwallet/extension-base/services/chain-service/utils';
import { SwapTxData } from '@subwallet/extension-base/types/swap';
import { AlertBox, MetaInfo } from '@subwallet/extension-koni-ui/components';
import { SwapTransactionBlock } from '@subwallet/extension-koni-ui/components/Swap';
import { BN_TEN, BN_ZERO, HistoryStatusMap, TxTypeNameMap } from '@subwallet/extension-koni-ui/constants';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { findAccountByAddress } from '@subwallet/extension-koni-ui/utils';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps {
  data: TransactionHistoryDisplayItem;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, data } = props;
  const { t } = useTranslation();
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const { currencyData, priceMap } = useSelector((state) => state.price);
  const swapInfo = data.additionalInfo as SwapTxData | undefined;
  const { accounts } = useSelector((state) => state.accountState);

  const estimatedFeeValue = useMemo(() => {
    let totalBalance = BN_ZERO;

    swapInfo?.quote.feeInfo.feeComponent.forEach((feeItem) => {
      const asset = assetRegistryMap[feeItem.tokenSlug];

      if (asset) {
        const { decimals, priceId } = asset;
        const price = priceMap[priceId || ''] || 0;

        totalBalance = totalBalance.plus(new BigN(feeItem.amount).div(BN_TEN.pow(decimals || 0)).multipliedBy(price));
      }
    });

    return totalBalance;
  }, [assetRegistryMap, swapInfo?.quote.feeInfo.feeComponent, priceMap]);

  if (!swapInfo) {
    return (
      <></>
    );
  }

  const assetFrom = assetRegistryMap[swapInfo.quote.pair.from];
  const assetTo = assetRegistryMap[swapInfo.quote.pair.to];
  const recipientAddress = data.to || swapInfo.recipient as string;
  const account = findAccountByAddress(accounts, recipientAddress);

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
        recipientName={account?.name}
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
          decimals={0}
          label={'Estimated fee'}
          prefix={(currencyData.isPrefix && currencyData.symbol) || ''}
          suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
          value={estimatedFeeValue}
        />
        <AlertBox
          className={'__swap-quote-warning'}
          description={t('You can view your swap process and details by clicking View on explorer')}
          title={t('Helpful tip')}
          type='info'
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
