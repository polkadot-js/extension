// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { balanceNoPrefixFormater, formatNumber } from '@subwallet/extension-base/utils';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import { saveShowBalance } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Number, Tooltip } from '@subwallet/react-ui';
import { SwNumberProps } from '@subwallet/react-ui/es/number';
import CN from 'classnames';
import { CaretLeft, CopySimple, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

type Props = ThemeProps & {
  balanceValue: SwNumberProps['value'];
  symbol: string;
  isSupportBuyTokens: boolean;
  isShrink: boolean;
  onClickBack: () => void;
  onOpenSendFund: () => void;
  onOpenBuyTokens: () => void;
  onOpenReceive: () => void;
};

function Component (
  { balanceValue,
    className = '',
    isShrink,
    isSupportBuyTokens,
    onClickBack,
    onOpenBuyTokens,
    onOpenReceive,
    onOpenSendFund,
    symbol }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { isShowBalance } = useSelector((state: RootState) => state.settings);
  const { isWebUI } = useContext(ScreenContext);
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
            tooltip={isWebUI ? t('Get address') : undefined}
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
            tooltip={isWebUI ? t('Send tokens') : undefined}
          />
          <div className={'__button-space'} />
          <Button
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
            tooltip={isWebUI ? t('Buy token') : undefined}
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

    '.__balance-value-wrapper': {
      display: 'flex',
      justifyContent: 'center'
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
        justifyContent: 'flex-start'
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
