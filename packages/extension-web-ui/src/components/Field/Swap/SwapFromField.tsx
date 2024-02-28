// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Button, Input, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { useCallback, useState } from 'react';
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
}

const Component = (props: Props) => {
  const { className, label, onSelectToken, tokenSelectorItems, tokenSelectorValue } = props;
  const { t } = useTranslation();
  const [convertedAmountValue] = useState<BigN | undefined>(undefined);

  const _onClickMaxBtn = useCallback(() => {
    //
  }, []);

  return (
    <div className={className}>
      <div className={'__label-wrapper'}>
        <div className='__label'>{label}</div>

        <Button
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
          />

          {
            convertedAmountValue && (
              <Number
                decimal={0}
                value={convertedAmountValue}
              />
            )
          }
        </div>
      </div>
    </div>
  );
};

const SwapFromField = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__input-container': {
      display: 'flex'
    },

    '.__amount-wrapper': {
      flex: 1
    }
  };
});

export default SwapFromField;
