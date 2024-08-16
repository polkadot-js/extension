// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EarningRewardItem, SpecialYieldPoolInfo, SpecialYieldPositionInfo } from '@subwallet/extension-base/types';
import { balanceNoPrefixFormater, BN_TEN, formatNumber, isAccountAll, isSameAddress } from '@subwallet/extension-base/utils';
import { BN_ZERO } from '@subwallet/extension-web-ui/constants';
import { HomeContext } from '@subwallet/extension-web-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { BackgroundColorMap, WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { saveShowBalance } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ExtraYieldPositionInfo, ThemeProps } from '@subwallet/extension-web-ui/types';
import { findAccountByAddress } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Number, Tooltip } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Eye, EyeSlash } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import styled from 'styled-components';

export type Props = ThemeProps & {
  items: ExtraYieldPositionInfo[];
}

function Component ({ className, items }: Props): React.ReactElement<Props> {
  const { setBackground } = useContext(WebUIContext);
  const { isWebUI } = useContext(ScreenContext);
  const isShowBalance = useSelector((state: RootState) => state.settings.isShowBalance);
  const { currencyData } = useSelector((state: RootState) => state.price);
  const earningRewards = useSelector((state) => state.earning.earningRewards);
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const { accounts, currentAccount } = useSelector((state) => state.accountState);

  const { t } = useTranslation();
  const { accountBalance: { totalBalanceInfo } } = useContext(HomeContext);

  const isTotalBalanceDecrease = totalBalanceInfo.change.status === 'decrease';

  const onChangeShowBalance = useCallback(() => {
    saveShowBalance(!isShowBalance).catch(console.error);
  }, [isShowBalance]);

  const totalUnstake = useMemo(() => {
    let result = BN_ZERO;

    items.forEach((item) => {
      result = result.plus((new BigN(item.unstakeBalance)).div(BN_TEN.pow(item.asset.decimals || 0)).multipliedBy(item.price));
    });

    return result;
  }, [items]);

  const totalActiveStake = useMemo(() => {
    let result = BN_ZERO;

    items.forEach((item) => {
      let rate = 1;

      if ('derivativeToken' in item) {
        const _item = item as SpecialYieldPositionInfo;
        const poolInfo = poolInfoMap?.[item.slug];

        const _poolInfo = poolInfo as SpecialYieldPoolInfo;
        const balanceToken = _item.balanceToken;

        if (_poolInfo) {
          const asset = _poolInfo.statistic?.assetEarning.find((i) => i.slug === balanceToken);

          rate = asset?.exchangeRate || 1;
        }
      }

      result = result.plus((new BigN(item.activeStake)).multipliedBy(rate).div(BN_TEN.pow(item.asset.decimals || 0)).multipliedBy(item.price));
    });

    return result;
  }, [items, poolInfoMap]);

  const totalValue = useMemo(() => {
    let result = BN_ZERO;

    items.forEach((item) => {
      result = result.plus((new BigN(item.totalStake)).div(BN_TEN.pow(item.asset.decimals || 0)).multipliedBy(item.price));
    });

    return result;
  }, [items]);

  const totalUnclaimReward = useMemo(() => {
    let result = BN_ZERO;
    const address = currentAccount?.address || '';
    const isAll = isAccountAll(address);

    const checkAddress = (item: EarningRewardItem) => {
      if (isAll) {
        const account = findAccountByAddress(accounts, item.address);

        return !!account;
      } else {
        return isSameAddress(address, item.address);
      }
    };

    earningRewards
      .filter(checkAddress)
      .forEach((item) => {
        const rewardItem = items.find((reward) => reward.slug === item.slug);

        if (rewardItem && item.unclaimedReward) {
          result = result.plus((new BigN(item.unclaimedReward)).div(BN_TEN.pow(rewardItem.asset.decimals || 0)).multipliedBy(rewardItem.price));
        }
      });

    return result;
  }, [currentAccount?.address, earningRewards, items, accounts]);

  useEffect(() => {
    const backgroundColor = isTotalBalanceDecrease ? BackgroundColorMap.DECREASE : BackgroundColorMap.INCREASE;

    setBackground(backgroundColor);
  }, [isTotalBalanceDecrease, setBackground]);

  return (
    <div className={CN(className, 'flex-row', { '-mobile-mode': !isWebUI })}>
      <div className={CN('__block-item', '__total-balance-block')}>
        <div className={'__block-title-wrapper'}>
          <div className={'__block-title'}>{t('Total value staked')}</div>
          {!isWebUI && <Button
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
          />}
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
                  prefix={`${totalValue.isZero() ? '' : '~'}${(currencyData?.isPrefix && currencyData.symbol) || ''}`}
                  subFloatNumber
                  value={totalValue}
                />
              </div>
            </Tooltip>
          </div>
        </div>
      </div>

      {isWebUI && (
        <>
          <div
            className='__block-divider'
          />

          <div className={CN('__block-item', '__balance-block')}>
            <div className='__block-title-wrapper'>
              <div className={'__block-title'}>{t('Total active stake')}</div>
            </div>
            <Tooltip
              overlayClassName={CN({
                'ant-tooltip-hidden': !isShowBalance
              })}
              placement={'top'}
              title={currencyData.symbol + ' ' + formatNumber(totalActiveStake, 0, balanceNoPrefixFormater)}
            >
              <div className={'__block-content'}>
                <Number
                  className='__balance-value'
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  prefix={`${totalActiveStake.isZero() ? '' : '~'}${(currencyData?.isPrefix && currencyData.symbol) || ''}`}
                  subFloatNumber
                  value={totalActiveStake}
                />
              </div>
            </Tooltip>

          </div>

          <div
            className='__block-divider'
          />

          <div className={CN('__block-item', '__balance-block')}>
            <div className='__block-title-wrapper'>
              <div className={'__block-title'}>{t('Total unstake')}</div>
            </div>
            <Tooltip
              overlayClassName={CN({
                'ant-tooltip-hidden': !isShowBalance
              })}
              placement={'top'}
              title={currencyData.symbol + ' ' + formatNumber(totalUnstake, 0, balanceNoPrefixFormater)}
            >
              <div className={'__block-content'}>
                <Number
                  className='__balance-value'
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  prefix={`${totalUnstake.isZero() ? '' : '~'}${(currencyData?.isPrefix && currencyData.symbol) || ''}`}
                  subFloatNumber
                  value={totalUnstake}
                />
              </div>
            </Tooltip>
          </div>

          <div
            className='__block-divider __divider-special'
          />

          <div className={CN('__block-item', '__balance-block')}>
            <div className='__block-title-wrapper'>
              <div className={'__block-title'}>{t('Total unclaimed rewards')}</div>
            </div>
            <Tooltip
              overlayClassName={CN({
                'ant-tooltip-hidden': !isShowBalance
              })}
              placement={'top'}
              title={currencyData.symbol + ' ' + formatNumber(totalUnclaimReward, 0, balanceNoPrefixFormater)}
            >
              <div className={'__block-content'}>
                <Number
                  className='__balance-value'
                  decimal={0}
                  decimalOpacity={0.45}
                  hide={!isShowBalance}
                  prefix={`${totalUnclaimReward.isZero() ? '' : '~'}${(currencyData?.isPrefix && currencyData.symbol) || ''}`}
                  subFloatNumber
                  value={totalUnclaimReward}
                />
              </div>
            </Tooltip>
          </div>
        </>)
      }
    </div>
  );
}

const EarningPositionBalance = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'stretch',
  flexWrap: 'wrap',

  '.ant-number .ant-typography': {
    fontSize: 'inherit !important',
    fontWeight: 'inherit !important',
    lineHeight: 'inherit'
  },

  '.__balance-block .__block-content': {
    paddingTop: 8
  },

  '&.-mobile-mode': {
    marginBottom: 0,
    '.__block-item': {
      minHeight: 'fit-content'
    },
    '.__block-title': {
      color: token.colorTextTertiary,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },
    '.__block-title-wrapper': {
      marginBottom: 0,
      minHeight: 'fit-content',
      gap: 4,
      paddingBottom: token.paddingXXS
    },
    '.__total-balance-block': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      paddingBottom: token.padding

    },
    '.__block-content': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2
    },
    '.__balance-visibility-toggle': {
      width: 20,
      height: 20,
      minWidth: 'fit-content',
      '.anticon': {
        height: 20,
        width: 20
      }
    }

  },

  '.__block-title': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorWhite
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
    height: 76,
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
    flex: '1 1 200px',
    minHeight: 128
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

  '@media screen and (max-width: 1135px)': {
    '.__divider-special': {
      display: 'none'
    }
  },

  '@media screen and (max-width: 1305px)': {
    '.__balance-value': {
      fontSize: '24px !important',
      lineHeight: '30px !important'
    },
    '.__balance-value .ant-number-decimal': {
      fontSize: '20px !important',
      lineHeight: '28px !important'
    },
    '.__total-balance-block': {
      '.__balance-value': {
        fontSize: '30px !important',
        lineHeight: '38px !important'
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
