// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapQuote } from '@subwallet/extension-base/types/swap';
import { SwapTokenSelector } from '@subwallet/extension-web-ui/components/Field/Swap/parts';
import { BN_TEN, BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  onSelectToken: (tokenSlug: string) => void;
  tokenSelectorValue?: string;
  tokenSelectorItems: TokenSelectorItemType[];
  decimals: number;
  amountValue?: string;
  currentQuote: SwapQuote | undefined,
}

const Component = (props: Props) => {
  const { className, currentQuote, label, onSelectToken, tokenSelectorItems, tokenSelectorValue } = props;
  const { t } = useTranslation();
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  const priceMap = useSelector((state) => state.price.priceMap);

  const getConvertedBalance = useMemo(() => {
    if (tokenSelectorValue && currentQuote && assetRegistryMap[tokenSelectorValue]) {
      const asset = assetRegistryMap[tokenSelectorValue];
      const { decimals, priceId } = asset;
      const price = priceMap[priceId || ''] || 0;

      const destinationValue = new BigN(currentQuote?.fromAmount).div(BN_TEN.pow(decimals || 0)).multipliedBy(currentQuote?.rate);

      const convertValue = new BigN(currentQuote.fromAmount).div(BN_TEN.pow(decimals || 0)).multipliedBy(price);

      return { destinationValue, convertValue };
    }

    return { destinationValue: BN_ZERO, convertValue: BN_ZERO };
  }, [assetRegistryMap, currentQuote, priceMap, tokenSelectorValue]);

  const { convertValue, destinationValue } = getConvertedBalance;

  return (
    <div className={className}>
      <div className={'__label-wrapper'}>
        <div className='__label'>{label || t('To')}</div>
      </div>
      <div className='__input-container'>
        <div className={'__token-selector-wrapper'}>
          <SwapTokenSelector
            id={'swap-to-token'}
            items={tokenSelectorItems}
            onSelect={onSelectToken}
            value={tokenSelectorValue}
          />
        </div>

        <div className={'__amount-wrapper'}>
          <div>
            {
              <Number
                decimal={0}
                value={destinationValue}
              />
            }
          </div>

          {
            (
              <Number
                decimal={0}
                prefix={'$'}
                value={convertValue}
              />
            )
          }
        </div>
      </div>
    </div>
  );
};

const SwapToField = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    marginBottom: 12,
    paddingBottom: 8,
    '.__input-container': {
      display: 'flex'
    },

    '.__amount-wrapper': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-end',
      alignItems: 'flex-end',
      paddingRight: 16
    },
    '.__label': {
      paddingRight: 16,
      paddingLeft: 16,
      paddingTop: 8,
      paddingBottom: 8
    }
  };
});

export default SwapToField;
