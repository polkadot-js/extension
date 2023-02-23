// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Number } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import { ArrowFatLinesDown, CaretLeft, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  balanceValue: SwNumberProps['value'];
  symbol: string;
  isShrink: boolean;
  onClickBack: () => void;
};

function Component (
  { balanceValue,
    className = '',
    isShrink,
    onClickBack,
    symbol }: Props): React.ReactElement<Props> {
  return (
    <div className={`tokens-upper-block ${className} ${isShrink ? '-shrink' : ''}`}>
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
          icon={<Icon phosphorIcon={ArrowFatLinesDown} />}
          shape='squircle'
          size={isShrink ? 'xs' : undefined}
        />
        <div className={'__button-space'} />
        <Button
          icon={<Icon phosphorIcon={PaperPlaneTilt} />}
          shape='squircle'
          size={isShrink ? 'xs' : undefined}
        />
        <div className={'__button-space'} />
        <Button
          icon={<Icon phosphorIcon={ShoppingCartSimple} />}
          shape='squircle'
          size={isShrink ? 'xs' : undefined}
        />
      </div>
    </div>
  );
}

export const DetailUpperBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    padding: '14px 8px 24px 8px',
    display: 'flex',
    flexDirection: 'column',

    '.__token-display': {
      textAlign: 'center',
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      marginBottom: 22
    },

    '.__back-button': {
      position: 'absolute',
      left: token.sizeSM,
      top: token.sizeSM,
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
      paddingBottom: 36,
      flexDirection: 'row',

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
