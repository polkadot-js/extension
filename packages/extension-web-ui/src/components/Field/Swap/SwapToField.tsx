// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapTokenSelector } from '@subwallet/extension-web-ui/components/Field/Swap/parts';
import { ThemeProps, TokenSelectorItemType } from '@subwallet/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  label?: string;
  onSelectToken: (tokenSlug: string) => void;
  tokenSelectorValue?: string;
  tokenSelectorItems: TokenSelectorItemType[];
  decimals: number;
  amountValue?: string;
}

const Component = (props: Props) => {
  const { className, label, onSelectToken, tokenSelectorItems, tokenSelectorValue } = props;
  const { t } = useTranslation();
  const [convertedAmountValue] = useState<BigN | undefined>(undefined);
  const [amountInputValue] = useState<string | undefined>(undefined);

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
              amountInputValue
            }
          </div>

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

const SwapToField = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__input-container': {
      display: 'flex'
    },

    '.__amount-wrapper': {
      flex: 1
    }
  };
});

export default SwapToField;
