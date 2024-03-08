// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _getAssetOriginChain, _getAssetSymbol } from '@subwallet/extension-base/services/chain-service/utils';
import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { Icon, Logo, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { ArrowRight } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

interface Props extends ThemeProps{
  data: TransactionHistoryDisplayItem
}

function getSymbol (assetInfo?: _ChainAsset) {
  return assetInfo ? _getAssetSymbol(assetInfo) : '';
}

function getOriginChain (assetInfo?: _ChainAsset) {
  return assetInfo ? _getAssetOriginChain(assetInfo) : '';
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, data } = props;
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  const { t } = useTranslation();
  const toAssetInfo = useMemo(() => {
    return assetRegistryMap[data.additionalInfo.quote.pair.to] || undefined;
  }, [assetRegistryMap, data.additionalInfo.quote.pair.to]);

  const fromAssetInfo = useMemo(() => {
    return assetRegistryMap[data.additionalInfo.quote.pair.from] || undefined;
  }, [assetRegistryMap, data.additionalInfo.quote.pair.from]);

  const destinationValue = new BigN(data.additionalInfo.quote.fromAmount).div(BN_TEN.pow(data.fee?.decimals || 0)).multipliedBy(data.additionalInfo.quote.rate).multipliedBy(1 - data.additionalInfo.slippage);

  return (
    <div className={CN(className, 'swap-confirmation-container')}>
      <div className={'__summary-quote'}>
        <div className={'__summary-from'}>
          <Logo
            className='token-logo'
            isShowSubLogo={true}
            shape='circle'
            size={24}
            subNetwork={getOriginChain(fromAssetInfo)}
            token={data.additionalInfo.quote.pair.from.toLowerCase()}
          />
          <Number
            className={'__amount-destination'}
            decimal={data.fee.decimals || 0}
            suffix={getSymbol(fromAssetInfo)}
            value={data.additionalInfo.quote.fromAmount}
          />
          <span className={'__quote-footer-label'}>Swap</span>
        </div>
        <Icon
          className={'middle-icon'}
          phosphorIcon={ArrowRight}
          size={'md'}
        />
        <div className={'__summary-to'}>
          <Logo
            className='token-logo'
            isShowSubLogo={true}
            shape='circle'
            size={24}
            subNetwork={getOriginChain(toAssetInfo)}
            token={data.additionalInfo.quote.pair.to.toLowerCase()}
          />
          <Number
            className={'__amount-destination'}
            decimal={0}
            suffix={getSymbol(toAssetInfo)}
            value={destinationValue}
          />
          <span className={'__quote-footer-label'}>{t('Min receive')}</span>
        </div>
      </div>
    </div>
  );
};

const SwapTransactionBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__quote-estimate-swap-confirm-value': {
      display: 'flex'
    },
    '.__summary-quote': {
      display: 'flex',
      justifyContent: 'space-between',
      backgroundColor: token.colorBgSecondary,
      gap: 12,
      paddingLeft: 12,
      paddingRight: 12,
      paddingTop: 16,
      paddingBottom: 16,
      borderRadius: 8,
      marginBottom: 16
    },
    '.__summary-to, .__summary-from': {
      display: 'flex',
      alignItems: 'center',
      flexDirection: 'column',
      flex: 1
    },
    '.__quote-footer-label': {
      color: token.colorTextTertiary,
      fontSize: 12,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM
    },
    '.__amount-destination': {
      color: token.colorTextLight2,
      fontSize: token.fontSizeLG,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeightLG
    },
    '&.swap-confirmation-container .__swap-route-container': {
      marginBottom: 20
    }
  };
});

export default SwapTransactionBlock;
