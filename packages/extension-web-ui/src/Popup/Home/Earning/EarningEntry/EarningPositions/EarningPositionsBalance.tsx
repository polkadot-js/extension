// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { balanceNoPrefixFormater, formatNumber } from '@subwallet/extension-base/utils';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-web-ui/contexts/screen/HomeContext';
import { BackgroundColorMap, WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { reloadCron, saveShowBalance } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Number, Tag, Tooltip } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowsClockwise, Eye, EyeSlash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

export type Props = ThemeProps

function Component ({ className }: Props): React.ReactElement<Props> {
  const dataContext = useContext(DataContext);
  const { setBackground } = useContext(WebUIContext);
  const isShowBalance = useSelector((state: RootState) => state.settings.isShowBalance);
  const { currencyData } = useSelector((state: RootState) => state.price);
  const [reloading, setReloading] = useState(false);

  const onChangeShowBalance = useCallback(() => {
    saveShowBalance(!isShowBalance).catch(console.error);
  }, [isShowBalance]);

  const { t } = useTranslation();
  const { accountBalance: { totalBalanceInfo } } = useContext(HomeContext);

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';
  const totalChangePercent = totalBalanceInfo.change.percent;
  const totalChangeValue = totalBalanceInfo.change.value;
  const totalValue = totalBalanceInfo.convertedValue;

  useEffect(() => {
    dataContext.awaitStores(['price', 'chainStore', 'assetRegistry', 'balance']).catch(console.error);
  }, [dataContext]);

  useEffect(() => {
    const backgroundColor = isTotalBalanceDecrease ? BackgroundColorMap.DECREASE : BackgroundColorMap.INCREASE;

    setBackground(backgroundColor);
  }, [isTotalBalanceDecrease, setBackground]);

  const reloadBalance = useCallback(() => {
    setReloading(true);
    reloadCron({ data: 'balance' })
      .catch(console.error)
      .finally(() => {
        setReloading(false);
      });
  }, []);

  return (
    <div className={CN(className, 'flex-row')}>
      <div className={CN('__block-item', '__total-balance-block')}>
        <div className={'__block-title-wrapper'}>
          <div className={'__block-title'}>{t('Total balance')}</div>
          <Button
            className='__balance-visibility-toggle'
            icon={
              <Icon
                phosphorIcon={!isShowBalance ? Eye : EyeSlash}
              />
            }
            onClick={onChangeShowBalance}
            size={'xs'}
            tooltip={isShowBalance ? t('Hide balance') : t('Show balance')}
            type='ghost'
          />
          <Button
            className='__balance-reload-toggle'
            icon={
              <Icon
                phosphorIcon={ArrowsClockwise}
              />
            }
            loading={reloading}
            onClick={reloadBalance}
            size={'xs'}
            tooltip={t('Refresh Balance')}
            type='ghost'
          />
        </div>

        <div className={'__block-content'}>
          <div className={'__balance-value-wrapper'}>
            <Tooltip
              overlayClassName={CN({
                'ant-tooltip-hidden': !isShowBalance
              })}
              placement={'top'}
              title={currencyData.symbol + ' ' + formatNumber(totalValue, 0, balanceNoPrefixFormater)}
            >
              <div>
                <Number
                  className={'__balance-value'}
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
                  subFloatNumber
                  value={totalValue}
                />
              </div>
            </Tooltip>
          </div>

          <div className={'__balance-change-container'}>
            <Number
              className={'__balance-change-value'}
              decimal={0}
              decimalOpacity={1}
              hide={!isShowBalance}
              prefix={isTotalBalanceDecrease ? `- ${currencyData?.symbol}` : `+ ${currencyData?.symbol}`}
              value={totalChangeValue}
            />
            <Tag
              className={`__balance-change-percent ${isTotalBalanceDecrease ? '-decrease' : ''}`}
              shape={'round'}
            >
              <Number
                decimal={0}
                decimalOpacity={1}
                hide={!isShowBalance}
                prefix={isTotalBalanceDecrease ? '-' : '+'}
                suffix={'%'}
                value={totalChangePercent}
                weight={700}
              />
            </Tag>
          </div>
        </div>
      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Transferable balance 1')}</div>
        </div>
        <Tooltip
          overlayClassName={CN({
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalBalanceInfo.freeValue, 0, balanceNoPrefixFormater)}
        >
          <div className={'__block-content'}>
            <Number
              className='__balance-value'
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
              subFloatNumber
              value={totalBalanceInfo.freeValue}
            />
          </div>
        </Tooltip>

      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Locked balance')}</div>
        </div>
        <Tooltip
          overlayClassName={CN({
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalBalanceInfo.lockedValue, 0, balanceNoPrefixFormater)}
        >
          <div className={'__block-content'}>
            <Number
              className='__balance-value'
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
              subFloatNumber
              value={totalBalanceInfo.lockedValue}
            />
          </div>
        </Tooltip>
      </div>

      <div
        className='__block-divider __divider-special'
      />

      <div className={CN('__block-item', '__balance-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Locked balance')}</div>
        </div>
        <Tooltip
          overlayClassName={CN({
            'ant-tooltip-hidden': !isShowBalance
          })}
          placement={'top'}
          title={currencyData.symbol + ' ' + formatNumber(totalBalanceInfo.lockedValue, 0, balanceNoPrefixFormater)}
        >
          <div className={'__block-content'}>
            <Number
              className='__balance-value'
              decimal={0}
              decimalOpacity={0.45}
              hide={!isShowBalance}
              prefix={(currencyData?.isPrefix && currencyData.symbol) || ''}
              subFloatNumber
              value={totalBalanceInfo.lockedValue}
            />
          </div>
        </Tooltip>
      </div>

    </div>
  );
}

const EarningPositionBalance = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  marginBottom: 56,
  flexWrap: 'wrap',

  '.ant-number .ant-typography': {
    fontSize: 'inherit !important',
    fontWeight: 'inherit !important',
    lineHeight: 'inherit'
  },

  '.__block-title': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight
  },

  '.__balance-value': {
    fontWeight: token.headingFontWeight,
    '.ant-number-decimal': {
      fontSize: '24px !important',
      lineHeight: '32px !important'
    }
  },

  '.__balance-value-wrapper': {
    display: 'flex'
  },

  '.__block-divider': {
    height: 116,
    width: 1,
    backgroundColor: token.colorBgDivider,
    marginTop: token.marginSM
  },

  '.__divider-special': {
    display: 'block'
  },

  '.__balance-change-container': {
    display: 'flex',
    justifyContent: 'start',
    alignItems: 'center',
    marginTop: token.marginSM
  },

  '.__balance-change-value': {
    marginRight: token.sizeXS,
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

  '.__block-item': {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 200px'
  },

  '.__block-title-wrapper': {
    display: 'flex',
    gap: token.sizeXS,
    minHeight: 40,
    marginBottom: token.marginXS,
    alignItems: 'center'
  },

  '.__total-balance-block': {
    '.__balance-value': {
      fontSize: 38,
      lineHeight: '46px'
    }
  },

  '.__balance-block': {
    alignItems: 'center',

    '.__balance-value': {
      fontSize: 30,
      lineHeight: '38px'
    }
  },

  '.__balance-reload-toggle': {
    marginLeft: -token.sizeXS / 2
  },

  '.__action-block': {
    alignItems: 'center',

    '.__block-content': {
      display: 'flex',
      gap: token.sizeSM
    }
  },

  '.__action-button': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: token.sizeSM,

    '.ant-squircle': {
      marginLeft: 6,
      marginRight: 6
    }
  },

  '@media screen and (min-width: 990px) and (max-width: 1200px)': {
    '.__divider-special': {
      display: 'none'
    }
  },

  '@media screen and (min-width: 1480px) and (max-width: 1600px)': {
    '.__balance-value': {
      fontSize: '28px !important',
      '.ant-number-decimal': {
        fontSize: '22px !important'
      }
    },
    '.__total-balance-block': {
      '.__balance-value': {
        fontSize: '35px !important'
      }
    }
  },

  '@media screen and (max-width: 1480px)': {
    '.__balance-value': {
      fontSize: '25px !important',
      '.ant-number-decimal': {
        fontSize: '20px !important'
      }
    }
  },

  '@media screen and (max-width: 1200px)': {
    '.__action-block': {
      flexBasis: '100% !important'
    }
  }

}));

export default EarningPositionBalance;
