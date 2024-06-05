// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { formatNumberString, swapCustomFormatter } from '@subwallet/extension-base/utils';
import { SwapTokenSelector } from '@subwallet/extension-web-ui/components/Field/Swap/parts';
import { BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { ActivityIndicator, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  onSelectToken: (tokenSlug: string) => void;
  tokenSelectorValue?: string;
  toAsset?: _ChainAsset;
  tokenSelectorItems: TokenSelectorItemType[];
  swapValue: BigN;
  loading?: boolean;
}
const numberMetadata = { maxNumberFormat: 2 };

const Component = (props: Props) => {
  const { className, label, loading, onSelectToken, swapValue, toAsset, tokenSelectorItems, tokenSelectorValue } = props;
  const { t } = useTranslation();
  const { currencyData, priceMap } = useSelector((state) => state.price);

  const getConvertedBalance = useMemo(() => {
    if (toAsset) {
      const { priceId } = toAsset;
      const price = priceMap[priceId || ''] || 0;

      return swapValue.multipliedBy(price);
    }

    return BN_ZERO;
  }, [priceMap, swapValue, toAsset]);

  const convertedDestinationSwapValue = useMemo(() => {
    if (swapValue.toString().includes('e')) {
      return formatNumberString(swapValue.toString());
    } else {
      return swapValue.toString();
    }
  }, [swapValue]);

  return (
    <div className={CN(className, 'swap-to-field')}>
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
          {
            loading && (
              <ActivityIndicator size={24} />
            )
          }
          {
            !loading && (
              <>
                <div className={'__amount-destination'}>{swapCustomFormatter(convertedDestinationSwapValue)}</div>
                <Number
                  className={'__amount-convert'}
                  customFormatter={swapCustomFormatter}
                  decimal={0}
                  formatType={'custom'}
                  metadata={numberMetadata}
                  prefix={(currencyData.isPrefix && currencyData.symbol) || ''}
                  suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
                  value={getConvertedBalance}
                />
              </>
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

    '&.swap-to-field': {
      '.ant-select-modal-input-border-default::before': {
        display: 'none'
      },
      '.ant-select-modal-input-wrapper': {
        paddingTop: 0,
        paddingBottom: 0
      }
    },
    '.__input-container': {
      display: 'flex'
    },
    '.__label': {
      fontSize: token.fontSizeSM,
      fontWeight: token.bodyFontWeight,
      lineHeight: token.lineHeightSM,
      paddingRight: 16,
      paddingLeft: 16,
      paddingTop: 8,
      paddingBottom: 8
    },

    '.__amount-wrapper': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'flex-end',
      paddingRight: 16,
      overflow: 'hidden'
    },
    '.__amount-destination': {
      maxHeight: 24,
      maxWidth: 185,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: token.fontSizeLG,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeightLG,
      color: token.colorWhite
    },
    '.__amount-convert': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.headingFontWeight,
      color: token.colorTextTertiary,

      '.ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    }
  };
});

export default SwapToField;
