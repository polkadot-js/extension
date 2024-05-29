// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { balanceNoPrefixFormater, formatNumber } from '@subwallet/extension-base/utils';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron, saveShowBalance } from '@subwallet/extension-web-ui/messaging';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Number, SwNumberProps, Tag, Tooltip } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsClockwise, ArrowsLeftRight, CopySimple, Eye, EyeSlash, PaperPlaneTilt, ShoppingCartSimple } from 'phosphor-react';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  totalValue: SwNumberProps['value'];
  totalChangeValue: SwNumberProps['value'];
  totalChangePercent: SwNumberProps['value'];
  isPriceDecrease: boolean;
  isShrink: boolean;
  onOpenSendFund: () => void;
  onOpenBuyTokens: () => void;
  onOpenReceive: () => void;
  onOpenSwap: () => void;
};

function Component (
  { className = '',
    isPriceDecrease,
    isShrink,
    onOpenBuyTokens,
    onOpenReceive,
    onOpenSendFund,
    onOpenSwap,
    totalChangePercent,
    totalChangeValue,
    totalValue }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { isShowBalance } = useSelector((state) => state.settings);
  const [reloading, setReloading] = useState(false);
  const { currencyData } = useSelector((state) => state.price);

  const onChangeShowBalance = useCallback(() => {
    saveShowBalance(!isShowBalance).catch(console.error);
  }, [isShowBalance]);

  const reloadBalance = useCallback(() => {
    setReloading(true);
    reloadCron({ data: 'balance' })
      .catch(console.error)
      .finally(() => {
        setReloading(false);
      });
  }, []);

  return (
    <div className={`tokens-upper-block ${className} ${isShrink ? '-shrink' : ''}`}>
      <div className='__total-balance-value-container'>
        <Tooltip
          overlayClassName={CN('__currency-value-detail-tooltip', {
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalValue, 0, balanceNoPrefixFormater)}
        >
          <div
            className='__total-balance-value-content'
            onClick={isShrink ? onChangeShowBalance : undefined}
          >
            {isShowBalance && <div className={CN('__total-balance-symbol')}>
              {currencyData.symbol}
            </div>}
            <Number
              className={'__total-balance-value'}
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              size={38}
              subFloatNumber
              value={totalValue}
            />
          </div>
        </Tooltip>
      </div>
      {!isShrink && (
        <div className={'__balance-change-container'}>
          <Button
            className='button-change-show-balance'
            icon={(
              <Icon
                phosphorIcon={ !isShowBalance ? Eye : EyeSlash}
              />
            )}
            onClick={onChangeShowBalance}
            size='xs'
            tooltip={isShowBalance ? t('Hide balance') : t('Show balance')}
            type='ghost'
          />
          <Number
            className={'__balance-change-value'}
            decimal={0}
            decimalOpacity={1}
            hide={!isShowBalance}
            prefix={isPriceDecrease ? `- ${(currencyData.isPrefix && currencyData.symbol) || ''}` : `+ ${(currencyData.isPrefix && currencyData.symbol) || ''}`}
            suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
            value={totalChangeValue}
          />
          <Tag
            className={`__balance-change-percent ${isPriceDecrease ? '-decrease' : ''}`}
            shape={'round'}
          >
            <Number
              decimal={0}
              decimalOpacity={1}
              prefix={isPriceDecrease ? '-' : '+'}
              suffix={'%'}
              value={totalChangePercent}
              weight={700}
            />
          </Tag>
          <Button
            className='button-change-show-balance'
            icon={(
              <Icon
                phosphorIcon={ ArrowsClockwise }
              />
            )}
            loading={reloading}
            onClick={reloadBalance}
            size='xs'
            tooltip={t('Refresh balance')}
            type='ghost'
          />
        </div>
      )}
      <div className={'__action-button-container'}>
        <Button
          icon={(
            <Icon
              phosphorIcon={CopySimple}
              size={isShrink ? 'sm' : 'md' }
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
              size={isShrink ? 'sm' : 'md' }
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
          icon={
            <Icon
              phosphorIcon={ArrowsLeftRight}
              size={isShrink ? 'sm' : 'md' }
              weight={'duotone'}
            />
          }
          onClick={onOpenSwap}
          shape='squircle'
          size={isShrink ? 'xs' : 'sm'}
          tooltip={t('Swap')}
        />
        <div className={'__button-space'} />
        <Button
          icon={
            <Icon
              phosphorIcon={ShoppingCartSimple}
              size={isShrink ? 'sm' : 'md' }
              weight={'duotone'}
            />
          }
          onClick={onOpenBuyTokens}
          shape='squircle'
          size={isShrink ? 'xs' : 'sm'}
          tooltip={t('Buy token')}
        />
      </div>
    </div>
  );
}

export const UpperBlock = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    padding: '0px 8px 24px 8px',
    display: 'flex',
    flexDirection: 'column',

    '.__total-balance-value': {
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

    '.ant-btn': {
      transition: 'width, height, padding 0s'
    },

    '.__balance-change-container': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: token.sizeXS,

      '.button-change-show-balance': {
        color: token.colorWhite,

        '&:hover': {
          color: token['gray-5']
        }
      },

      '.ant-typography': {
        lineHeight: 'inherit',
        // todo: may update number component to clear this !important
        color: 'inherit !important',
        fontSize: 'inherit !important'
      }
    },

    '.__balance-change-value': {
      lineHeight: token.lineHeight
    },

    '.__balance-change-percent': {
      backgroundColor: token['cyan-6'],
      color: token['green-1'],
      marginInlineEnd: 0,
      display: 'flex',

      '&.-decrease': {
        backgroundColor: token.colorError,
        color: token.colorTextLight1
      },

      '.ant-number': {
        fontSize: token.fontSizeXS
      }
    },

    '.__action-button-container': {
      display: 'flex',
      justifyContent: 'center',
      padding: '26px 8px 0 8px'
    },

    '.__button-space': {
      width: token.size
    },

    '.__total-balance-value-content': {
      display: 'flex',
      justifyContent: 'center',
      cursor: 'pointer',
      width: 'fit-content',
      margin: 'auto'
    },

    '&.-shrink': {
      paddingBottom: 32,
      flexDirection: 'row',

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

      '.__total-balance-value-container': {
        flex: 1
      },

      '.__total-balance-value-content': {
        cursor: 'pointer',
        width: 'fit-content',
        margin: 0
      },

      '.__total-balance-value': {
        textAlign: 'left',
        lineHeight: token.lineHeightHeading2,
        fontSize: token.fontSizeHeading2,

        '.ant-number-prefix, .ant-number-integer, .ant-number-hide-content': {
          fontSize: 'inherit !important'
        }
      },

      '.__balance-change-container': {
        display: 'none'
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
