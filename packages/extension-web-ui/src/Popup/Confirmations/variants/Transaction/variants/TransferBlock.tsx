// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicDataTypeMap, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AlertBox } from '@subwallet/extension-web-ui/components';
import MetaInfo from '@subwallet/extension-web-ui/components/MetaInfo/MetaInfo';
import { useGetChainPrefixBySlug, useGetNativeTokenBasicInfo } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { BaseTransactionConfirmationProps } from './Base';

type Props = BaseTransactionConfirmationProps;

const Component: React.FC<Props> = ({ className, transaction }: Props) => {
  const { t } = useTranslation();
  const data = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_BALANCE];
  const xcmData = transaction.data as ExtrinsicDataTypeMap[ExtrinsicType.TRANSFER_XCM];
  const chainInfoMap = useSelector((root: RootState) => root.chainStore.chainInfoMap);
  const assetRegistryMap = useSelector((root: RootState) => root.assetRegistry.assetRegistry);
  const tokenInfo = assetRegistryMap[transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM ? xcmData.tokenSlug : data.tokenSlug];

  const chainInfo = useMemo(
    () => chainInfoMap[transaction.chain],
    [chainInfoMap, transaction.chain]
  );

  const receiveChain = useMemo(() => {
    if (xcmData) {
      return xcmData.destinationNetworkKey || transaction.chain;
    } else {
      return transaction.chain;
    }
  }, [transaction.chain, xcmData]);
  const { decimals: chainDecimals, symbol: chainSymbol } = useGetNativeTokenBasicInfo(transaction.chain);
  const senderPrefix = useGetChainPrefixBySlug(transaction.chain);
  const receiverPrefix = useGetChainPrefixBySlug(receiveChain);

  return (
    <>
      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Account
          address={data.from}
          label={t('Send from')}
          networkPrefix={senderPrefix}
        />

        {
          transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM && chainInfo &&
          (
            <MetaInfo.Chain
              chain={chainInfo.slug}
              label={t('Sender network')}
            />
          )
        }

        <MetaInfo.Account
          address={data.to}
          label={t('Send to')}
          networkPrefix={receiverPrefix}
        />

        {
          transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM && chainInfo &&
          (
            <MetaInfo.Chain
              chain={xcmData.destinationNetworkKey}
              label={t('Destination network')}
            />
          )
        }

        {
          transaction.extrinsicType !== ExtrinsicType.TRANSFER_XCM && chainInfo &&
          (
            <MetaInfo.Chain
              chain={chainInfo.slug}
              label={t('Network')}
            />
          )
        }
      </MetaInfo>

      <MetaInfo hasBackgroundWrapper>
        <MetaInfo.Number
          decimals={tokenInfo.decimals || 0}
          label={t('Amount')}
          suffix={tokenInfo.symbol}
          value={data.value || 0}
        />

        <MetaInfo.Number
          decimals={chainDecimals}
          label={t('Estimated fee')}
          suffix={chainSymbol}
          value={transaction.estimateFee?.value || 0}
        />
      </MetaInfo>
      {
        transaction.extrinsicType === ExtrinsicType.TRANSFER_XCM &&
        (
          <AlertBox
            className={CN(className, 'alert-area')}
            description={t("You'll need to pay an additional fee for the destination network in a cross-chain transfer. This fee cannot be calculated in advance.")}
            title={t('Pay attention!')}
            type='warning'
          />
        )
      }
    </>
  );
};

export const TransferBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.alert-area': {
      marginTop: token.marginSM
    }
  };
});
