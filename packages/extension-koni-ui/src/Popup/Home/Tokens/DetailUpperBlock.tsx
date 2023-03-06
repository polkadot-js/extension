// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_TRANSAK_TOKEN } from '@subwallet/extension-koni-ui/constants/transak';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Number } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import { ArrowFatLinesDown, CaretLeft, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  balanceValue: SwNumberProps['value'];
  symbol: string;
  isShrink: boolean;
  onClickBack: () => void;
};

function isSupportBuyTokens (symbol: string) {
  return !!PREDEFINED_TRANSAK_TOKEN[symbol];
}

function Component (
  { balanceValue,
    className = '',
    isShrink,
    onClickBack,
    symbol }: Props): React.ReactElement<Props> {
  const navigate = useNavigate();
  const openSendFund = useCallback(() => {
    navigate('/transaction/send-fund');
  },
  [navigate]
  );

  const openBuyTokens = useCallback(() => {
    navigate('/buy-tokens', { state: { symbol } });
  },
  [navigate, symbol]
  );

  return (
    <div className={`tokens-upper-block ${className} ${isShrink ? '-shrink' : ''}`}>
      <div className='__top'>
        <Button
          className={'__back-button'}
          icon={
            <Icon
              customSize={'24px'}
              phosphorIcon={CaretLeft}
            />
          }
          onClick={onClickBack}
          size={'xs'}
          type={'ghost'}
        />
        <div className={'__token-display'}>Token: {symbol}</div>
      </div>
      <div className='__bottom'>
        <Number
          className={'__balance-value'}
          decimal={0}
          decimalOpacity={0.45}
          prefix='$'
          size={38}
          subFloatNumber
          value={balanceValue}
        />
        <div className={'__action-button-container'}>
          <Button
            icon={<Icon
              phosphorIcon={ArrowFatLinesDown}
              size={isShrink ? 'sm' : 'md'}
            />}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
          />
          <div className={'__button-space'} />
          <Button
            icon={<Icon
              phosphorIcon={PaperPlaneTilt}
              size={isShrink ? 'sm' : 'md'}
            />}
            onClick={openSendFund}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
          />
          <div className={'__button-space'} />
          <Button
            disabled={!isSupportBuyTokens(symbol)}
            icon={<Icon
              phosphorIcon={ShoppingCartSimple}
              size={isShrink ? 'sm' : 'md'}
            />}
            onClick={openBuyTokens}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
          />
        </div>
      </div>
    </div>
  );
}

export const DetailUpperBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    padding: '0px 8px 24px 8px',
    display: 'flex',
    flexDirection: 'column',

    '.__top': {
      display: 'flex',
      marginBottom: 16,
      alignItems: 'center'
    },

    '.__token-display': {
      textAlign: 'center',
      flex: 1,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      marginRight: 40
    },

    '.ant-btn': {
      transition: 'width, height, padding 0s'
    },

    '.__back-button': {
      color: token.colorTextLight1,

      '&:hover': {
        color: token.colorTextLight3
      },

      '&:active': {
        color: token.colorTextLight4
      }
    },

    '.__balance-value': {
      textAlign: 'center',
      padding: '0px 8px',
      lineHeight: token.lineHeightHeading1,
      fontSize: token.fontSizeHeading1,
      whiteSpace: 'nowrap',
      overflow: 'hidden',

      '.ant-typography': {
        lineHeight: 'inherit'
      }
    },

    '.__action-button-container': {
      display: 'flex',
      justifyContent: 'center',
      padding: '24px 8px 0 8px'
    },

    '.__button-space': {
      width: token.size
    },

    '&.-shrink': {

      '.__bottom': {
        display: 'flex'
      },

      '.__balance-value': {
        textAlign: 'left',
        lineHeight: token.lineHeightHeading2,
        fontSize: token.fontSizeHeading2,
        flex: 1,

        '.ant-number-prefix, .ant-number-integer': {
          fontSize: 'inherit !important'
        }
      },

      '.__action-button-container': {
        paddingTop: 0
      },

      '.__button-space': {
        width: token.sizeXS
      }
    }
  });
});
