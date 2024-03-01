// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getInputValuesFromString, getOutputValuesFromString } from '@subwallet/extension-web-ui/components/Field/AmountInput';
import { BN_TEN, BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Button, Input, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { ChangeEventHandler, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { SwapTokenSelector } from './parts';

type Props = ThemeProps & {
  label: string;
  onSelectToken: (tokenSlug: string) => void;
  tokenSelectorValue?: string;
  tokenSelectorItems: TokenSelectorItemType[];
  decimals: number;
  amountMaxValue?: string;
  amountValue?: string;
  onSetMax?: (value: boolean) => void;
  onChangeAmount: (value: string) => void;
}

const Component = (props: Props) => {
  const { amountValue, className, decimals, label,
    onChangeAmount, onSelectToken, tokenSelectorItems,
    tokenSelectorValue } = props;
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(amountValue ? getInputValuesFromString(amountValue, decimals) : amountValue);
  const assetRegistryMap = useSelector((state) => state.assetRegistry.assetRegistry);
  const priceMap = useSelector((state) => state.price.priceMap);

  const _onClickMaxBtn = useCallback(() => {
    //
  }, []);

  const onChangeInput: ChangeEventHandler<HTMLInputElement> = useCallback((event) => {
    const value = event.target.value;

    setInputValue(value);

    const transformVal = getOutputValuesFromString(value, decimals);

    onChangeAmount(transformVal);
  }, [decimals, onChangeAmount]);

  const getConvertedInputValue = useMemo(() => {
    if (tokenSelectorValue && inputValue && assetRegistryMap[tokenSelectorValue]) {
      const asset = assetRegistryMap[tokenSelectorValue];
      const { priceId } = asset;

      const transformVal = getOutputValuesFromString(inputValue, decimals);
      const price = priceMap[priceId || ''] || 0;

      return new BigN(transformVal).div(BN_TEN.pow(decimals || 0)).multipliedBy(price);
    }

    return BN_ZERO;
  }, [assetRegistryMap, decimals, inputValue, priceMap, tokenSelectorValue]);

  return (
    <div className={className}>
      <div className={'__label-wrapper'}>
        <div className='__label'>{label}</div>

        <Button
          className={'__max-button'}
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
          <Input
            className={className}
            onChange={onChangeInput}
            type={'number'}
            value={inputValue}
          />

          {
            <Number
              className={'__amount-convert'}
              decimal={0}
              prefix={'$'}
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
    marginBottom: 8,
    '.__input-container': {
      display: 'flex'
    },
    '.__token-selector-wrapper .ant-select-modal-input-wrapper': {
      color: token.colorWhite
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
      justifyContent: 'flex-end',
      flexDirection: 'column',
      alignItems: 'end',
      paddingRight: 4
    },
    '.ant-input-wrapper .ant-input': {
      textAlign: 'right',
      fontSize: 16,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite

    },
    '.__amount-wrapper .ant-input-container': {
      borderTopLeftRadius: 0,
      borderBottomLeftRadius: 0
    },
    '.__amount-wrapper .__amount-convert': {
      paddingRight: 12
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
