// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { balanceNoPrefixFormater, formatNumber } from '@subwallet/extension-base/utils';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { saveShowBalance } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Number, Tooltip } from '@subwallet/react-ui';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import CN from 'classnames';
import { ArrowsLeftRight, CaretLeft, CopySimple, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps & {
  balanceValue: SwNumberProps['value'];
  symbol: string;
  isSupportBuyTokens: boolean;
  isSupportSwap: boolean;
  isShrink: boolean;
  onClickBack: () => void;
  onOpenSendFund: () => void;
  onOpenBuyTokens: () => void;
  onOpenReceive: () => void;
  onOpenSwap: () => void;
};

function Component (
  { balanceValue,
    className = '',
    isShrink,
    isSupportBuyTokens,
    isSupportSwap,
    onClickBack,
    onOpenBuyTokens,
    onOpenReceive,
    onOpenSendFund,
    onOpenSwap,
    symbol }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { isShowBalance } = useSelector((state: RootState) => state.settings);
  const { currencyData } = useSelector((state: RootState) => state.price);
  const onChangeShowBalance = useCallback(() => {
    saveShowBalance(!isShowBalance).catch(console.error);
  }, [isShowBalance]);

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
        <div className={'__token-display'}>{t('Token')}: {symbol}</div>
      </div>
      <div className='__bottom'>
        <Tooltip
          overlayClassName={CN('__currency-value-detail-tooltip', {
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(balanceValue, 0, balanceNoPrefixFormater)}
        >
          <div
            className='__balance-value-wrapper'
            onClick={isShrink ? onChangeShowBalance : undefined}
          >
            {isShowBalance && <div className={CN('__total-balance-symbol')}>
              {currencyData.symbol}
            </div>}
            <Number
              className={'__balance-value'}
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              size={38}
              subFloatNumber
              value={balanceValue}
            />
          </div>
        </Tooltip>
        <div className={'__action-button-container'}>
          <Button
            icon={(
              <Icon
                phosphorIcon={CopySimple}
                size={isShrink ? 'sm' : 'md'}
                weight={'duotone'}
              />
            )}
            onClick={onOpenReceive}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
            tooltip={t('Get address')}
          />
          <div className={'__button-space'} />
          <Button
            icon={(
              <Icon
                phosphorIcon={PaperPlaneTilt}
                size={isShrink ? 'sm' : 'md'}
                weight={'duotone'}
              />
            )}
            onClick={onOpenSendFund}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
            tooltip={t('Send tokens')}
          />
          <div className={'__button-space'} />
          <Button
            disabled={!isSupportSwap}
            icon={(
              <Icon
                phosphorIcon={ArrowsLeftRight}
                size={isShrink ? 'sm' : 'md'}
                weight={'duotone'}
              />
            )}
            onClick={onOpenSwap}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
            tooltip={t('Swap')}
          />
          <div className={CN('__button-space', { hidden: isShrink })} />
          <Button
            className={CN({ hidden: isShrink })}
            disabled={!isSupportBuyTokens}
            icon={(
              <Icon
                phosphorIcon={ShoppingCartSimple}
                size={isShrink ? 'sm' : 'md'}
                weight={'duotone'}
              />
            )}
            onClick={onOpenBuyTokens}
            shape='squircle'
            size={isShrink ? 'xs' : 'sm'}
            tooltip={t('Buy token')}
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

    '.__total-balance-symbol': {
      marginLeft: 8,
      marginRight: -4,
      fontSize: token.fontSizeXL,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.fontWeightStrong,

      '&.-not-show-balance': {
        display: 'none'
      }

    },

    '.__balance-value-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      cursor: 'pointer',
      width: 'fit-content',
      margin: 'auto'
    },

    '&.-shrink': {
      '.__bottom': {
        display: 'flex'
      },
      '.__total-balance-symbol': {
        marginLeft: 8,
        marginRight: -4,
        fontSize: token.fontSizeLG,
        lineHeight: token.lineHeightLG,
        fontWeight: token.fontWeightStrong,

        '&.-not-show-balance': {
          display: 'none'
        }

      },

      '.__balance-value-wrapper': {
        flex: 1,
        margin: 0,
        cursor: 'pointer',
        justifyContent: 'flex-start',
        width: 'fit-content'
      },

      '.__balance-value': {
        textAlign: 'left',
        lineHeight: token.lineHeightHeading2,
        fontSize: token.fontSizeHeading2,
        cursor: 'pointer',
        width: 'fit-content',

        '.ant-number-prefix, .ant-number-integer, .ant-number-hide-content': {
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
