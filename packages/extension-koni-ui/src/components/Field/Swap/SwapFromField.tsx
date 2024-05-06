// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { _getAssetDecimals, _getAssetPriceId } from '@subwallet/extension-base/services/chain-service/utils';
import { swapCustomFormatter } from '@subwallet/extension-base/utils';
import { BasicInputEvent } from '@subwallet/extension-koni-ui/components';
import AmountInput from '@subwallet/extension-koni-ui/components/Field/AmountInput';
import { SwapTokenSelector } from '@subwallet/extension-koni-ui/components/Field/Swap/parts';
import { BN_TEN, BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenSelectorItemType } from '@subwallet/extension-koni-ui/types/field';
import { Button, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  label: string;
  onSelectToken: (tokenSlug: string) => void;
  tokenSelectorValue?: string;
  tokenSelectorItems: TokenSelectorItemType[];
  fromAsset: _ChainAsset | undefined;
  amountMaxValue?: string;
  amountValue?: string;
  onSetMax?: (value: boolean) => void;
  onChangeAmount: (value: string) => void;
}

// todo: support max later
const numberMetadata = { maxNumberFormat: 2 };

type DebounceFunc<T extends any[]> = (func: (...args: T) => void, delay: number) => (...args: T) => void;

const debounce: DebounceFunc<[BasicInputEvent]> = (func, delay) => {
  let timer: NodeJS.Timeout;

  return function (event) {
    clearTimeout(timer);
    timer = setTimeout(() => func(event), delay);
  };
};

const Component = (props: Props) => {
  const { amountValue, className, fromAsset, label,
    onChangeAmount, onSelectToken, tokenSelectorItems,
    tokenSelectorValue } = props;
  const { t } = useTranslation();
  const decimals = _getAssetDecimals(fromAsset);
  const priceId = _getAssetPriceId(fromAsset);
  const { currencyData, priceMap } = useSelector((state) => state.price);

  const _onClickMaxBtn = useCallback(() => {
    //
  }, []);

  const getConvertedInputValue = useMemo(() => {
    if (amountValue) {
      const price = priceMap[priceId] || 0;

      return new BigN(amountValue).div(BN_TEN.pow(decimals || 0)).multipliedBy(price);
    }

    return BN_ZERO;
  }, [amountValue, decimals, priceId, priceMap]);

  const onChangeInput = useCallback((event: BasicInputEvent) => {
    onChangeAmount(event.target.value);
  }, [onChangeAmount]);

  return (
    <div className={CN(className, 'swap-form-field')}>
      <div className={'__label-wrapper'}>
        <div className='__label'>{label}</div>

        <Button
          className={'__max-button hidden'}
          onClick={_onClickMaxBtn}
          size='xs'
          type='ghost'
        >
          <span className='max-btn-text'>{t('Max')}</span>
        </Button>
      </div>
      <div className='__input-container'>
        <div className={'__token-selector-wrapper'}>
          <SwapTokenSelector
            id={'swap-from-token'}
            items={tokenSelectorItems}
            onSelect={onSelectToken}
            value={tokenSelectorValue}
          />
        </div>

        <div className={'__amount-wrapper'}>
          <AmountInput
            decimals={decimals}
            defaultInvalidOutputValue={'00'}
            maxValue={'0'} // support later
            onChange={debounce(onChangeInput, 500)}
            showMaxButton={false}
            value={amountValue}
          />

          {
            <Number
              className={'__amount-convert'}
              customFormatter={swapCustomFormatter}
              decimal={0}
              formatType={'custom'}
              metadata={numberMetadata}
              prefix={(currencyData.isPrefix && currencyData.symbol) || ''}
              suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
              value={getConvertedInputValue}
            />
          }
        </div>
      </div>
    </div>
  );
};

const SwapFromField = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    paddingBottom: 8,
    position: 'relative',
    marginBottom: 4,
    '&.swap-form-field': {
      '.ant-input-container::before': {
        display: 'none'
      },
      '.ant-select-modal-input-container::before': {
        display: 'none'
      },
      '.ant-select-modal-input-wrapper': {
        paddingTop: 0,
        paddingBottom: 0
      },
      '.ant-input-affix-wrapper': {
        maxHeight: 24
      },
      '.ant-input': {
        paddingTop: 0,
        paddingBottom: 0,
        height: 24
      },
      '.ant-input-container': {
        paddingBottom: 0,
        marginBottom: 0
      }
    },

    '.__input-container': {
      display: 'flex'
    },
    '.__amount-wrapper .ant-input-affix-wrapper': {
      paddingLeft: 0,
      paddingRight: 0
    },

    '.__label-wrapper .__max-button': {
      maxHeight: 20
    },
    '.__label-wrapper .__label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight
    },

    '.__amount-wrapper': {
      flex: 1,
      display: 'flex',
      justifyContent: 'center',
      flexDirection: 'column',
      alignItems: 'end',
      paddingRight: 16,
      overflow: 'hidden'
    },
    '.ant-input-wrapper .ant-input': {
      textAlign: 'right',
      fontSize: 16,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite,
      cursor: 'pointer'

    },
    '.__amount-wrapper .ant-input-container': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
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
    },

    '.__label-wrapper': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      paddingLeft: 16,
      paddingTop: 8,
      paddingBottom: 8
    },
    '.max-btn-text': {
      color: token.colorSuccess
    },
    '.__token-selector-wrapper .ant-select-modal-input-border-default': {
      borderTopRightRadius: 0,
      borderBottomRightRadius: 0
    }
  };
});

export default SwapFromField;
