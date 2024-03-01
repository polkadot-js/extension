// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SwapQuote } from '@subwallet/extension-base/types/swap';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, CircleWavyCheck } from 'phosphor-react';
import React, { useCallback } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  isRecommend?: boolean,
  quote: SwapQuote;
  selected?: boolean,
  onSelect?: (quote: SwapQuote) => void,
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, isRecommend, onSelect, quote, selected } = props;

  const _onSelect = useCallback(() => {
    onSelect?.(quote);
  }, [onSelect, quote]);

  return (
    <>
      <div
        className={CN(className, 'swap-quotes-container')}
        onClick={_onSelect}
      >
        <div className={'__left-part'}>
          <div className={'__line-1'}>
            <span className={'__provider-name'}>{quote.provider.name}</span>
            {isRecommend && (
              <Icon
                className='wavy-icon'
                customSize={'16px'}
                phosphorIcon={CircleWavyCheck}
                size='md'
                weight='fill'
              />
            )}
          </div>
          <div className={'__line-2'}>
            <span className={'__item-label'}>Est.receive</span>
            <span className={'__item-value'}></span>
          </div>
        </div>
        {selected && (<div className={'__right-part'}>
          <Icon
            className='check-icon'
            phosphorIcon={CheckCircle}
            size='md'
            weight='fill'
          />
        </div>)}
      </div>
    </>
  );
};

const ChooseFeeItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: token.colorBgSecondary,
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    '.__line-2': {
      display: 'flex',
      gap: 4
    },
    '.wavy-icon': {
      color: token.colorPrimary,
      paddingLeft: 4
    },
    '.__provider-name': {
      fontSize: 14,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeight,
      color: token.colorTextTertiary
    },
    '.__item-label': {
      color: token.colorTextTertiary
    },
    '.__item-value': {
      color: token.colorWhite
    },
    '.check-icon': {
      color: token.colorSuccess
    }
  };
});

export default ChooseFeeItem;
