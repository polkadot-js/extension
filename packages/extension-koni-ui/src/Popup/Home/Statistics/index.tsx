// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PieDonutChart, { DataItem } from '@garvae/react-pie-donut-chart';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import { ProgressBar } from '@subwallet/extension-koni-ui/components/ProgressBar';
import { BN_100, BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useGetStakingList } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { sortTokenByValue } from '@subwallet/extension-koni-ui/utils';
import { Logo, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import React, { Context, useContext, useEffect, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps;

type PresentItem = {
  logoKey: string;
  symbol: string;
  percent: number;
};

type ChartItem = DataItem & {
  label: string;
};

const Component = ({ className }: Props) => {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const token = useContext<Theme>(ThemeContext as Context<Theme>).token;
  const { accountBalance: { tokenGroupBalanceMap,
    totalBalanceInfo } } = useContext(HomeContext);
  const { data: stakingItems, priceMap } = useGetStakingList();

  const outletContext: {
    setShowSearchInput: React.Dispatch<React.SetStateAction<boolean>>
  } = useOutletContext();
  const setShowSearchInput = outletContext?.setShowSearchInput;

  useEffect(() => {
    setShowSearchInput?.(false);
  }, [setShowSearchInput]);

  const isTotalZero = totalBalanceInfo.convertedValue.eq(BN_ZERO);

  const presentItems = useMemo<PresentItem[]>(() => {
    if (isTotalZero) {
      return [];
    }

    const balanceItems = Object.values(tokenGroupBalanceMap).sort(sortTokenByValue);

    const results: PresentItem[] = [];

    const itemLength = balanceItems.length < 6 ? balanceItems.length : 6;

    for (let i = 0; i < itemLength; i++) {
      const item = balanceItems[i];

      if (!item) {
        continue;
      }

      if (item.total.convertedValue.eq(BN_ZERO)) {
        break;
      }

      results.push({
        logoKey: item.logoKey,
        symbol: item.symbol,
        percent: item.total.convertedValue.multipliedBy(BN_100).dividedBy(totalBalanceInfo.convertedValue).toNumber()
      });
    }

    return results;
  }, [isTotalZero, tokenGroupBalanceMap, totalBalanceInfo.convertedValue]);

  const renderPresentItem = (item: PresentItem) => {
    return (
      <div
        className={'__present-item'}
        key={item.logoKey}
      >
        <div className={'__present-item-left-part'}>
          <Logo
            shape={'squircle'}
            size={24}
            token={item.logoKey}
          />

          <div className={'__present-item-symbol'}>{item.symbol}</div>
        </div>

        <div className={'__present-item-mid-part'}>
          <ProgressBar percent={item.percent} />
        </div>

        <div className={'__present-item-right-part'}>
          <Number
            className={'__present-item-percent'}
            decimal={0}
            suffix={'%'}
            value={item.percent}
          />
        </div>
      </div>
    );
  };

  const renderLegendItem = (item: ChartItem) => {
    return (
      <div
        className={'__legend-item'}
        key={item.id}
      >
        <div
          className='__legend-item-dot'
          style={{ backgroundColor: item.color }}
        ></div>
        <div className='__legend-item-label'>
          {item.label}
        </div>
        <Number
          className={'__legend-item-percent'}
          decimal={0}
          suffix={'%'}
          value={item.value}
        />
      </div>
    );
  };

  const transferablePercent = (() => {
    if (isTotalZero) {
      return 0;
    }

    return +totalBalanceInfo.freeValue.multipliedBy(BN_100).dividedBy(totalBalanceInfo.convertedValue).toFixed(2);
  })();

  const stakingPercent = (() => {
    if (isTotalZero) {
      return 0;
    }

    let percentBigN = new BigN(0);

    for (const si of stakingItems) {
      if (!si.staking.balance || BN_ZERO.eq(si.staking.balance)) {
        continue;
      }

      const balanceValue = getBalanceValue(si.staking.balance || '0', si.decimals);
      const convertedBalanceValue = getConvertedBalanceValue(balanceValue, +`${priceMap[si.staking.chain]}` || 0);

      percentBigN = percentBigN.plus(convertedBalanceValue);
    }

    return +percentBigN.multipliedBy(BN_100).dividedBy(totalBalanceInfo.convertedValue).toFixed(2);
  })();

  const otherPercent = (() => {
    if (isTotalZero) {
      return 0;
    }

    const result = (10000 - transferablePercent * 100 - stakingPercent * 100) / 100;

    return result > 0 ? result : 0;
  })();

  const chartItems: ChartItem[] = [
    {
      id: 'Transferable',
      value: transferablePercent,
      color: token['colorPrimary-6'],
      label: t('Transferable')
    },
    {
      id: 'Staking',
      value: stakingPercent,
      color: token.colorSecondary,
      label: t('Staking')
    },
    {
      id: 'Other',
      value: otherPercent,
      color: token['magenta-6'],
      label: t('Other')
    }
  ];

  const chartData: ChartItem[] = chartItems.filter((i) => i.value > 0);

  return (
    <PageWrapper
      className={className}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      {
        isTotalZero
          ? (
            <NoContent pageType={PAGE_TYPE.STATISTIC} />
          )
          : (
            <div className='__box-container'>
              <div className='__box-part -left-part'>
                <div className='__box-part-title'>
                  {t('Portfolio Allocation')}
                </div>

                <div className='__present-items-area'>
                  {presentItems.map(renderPresentItem)}
                </div>
              </div>
              <div className='__box-part'>
                <div className='__box-part-title'>
                  {t('Portfolio Distribution')}
                </div>

                <div className='__chart-area'>
                  <div className='__chart-wrapper'>
                    <PieDonutChart
                      animationSpeed={0}
                      chartCenterSize={194}
                      colors={{
                        chartCenter: token.colorBgSecondary,
                        text: 'transparent'
                      }}
                      data={chartData}
                      hoverScaleRatio={1.03}
                      resizeReRenderDebounceTime={100}
                      size={240}
                    />
                  </div>

                  <div className='__legend-area'>
                    {chartItems.map(renderLegendItem)}
                  </div>
                </div>
              </div>

            </div>
          )
      }
    </PageWrapper>
  );
};

const Statistics = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-number .ant-typography': {
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      color: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.__box-container': {
      display: 'flex',
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,
      gap: token.size,
      padding: token.padding,
      paddingBottom: token.paddingLG,
      flexWrap: 'wrap'
    },

    '.__box-part': {
      flex: 1,
      flexBasis: 350
    },

    '.__box-part-title': {
      color: token.colorTextLight3,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      marginBottom: 34
    },

    '.__present-items-area': {
      display: 'flex',
      gap: token.size,
      flexDirection: 'column'
    },

    '.__present-item': {
      display: 'flex',
      gap: token.size,
      alignItems: 'center'
    },

    '.__present-item-left-part': {
      minWidth: 80,
      display: 'flex',
      gap: token.sizeXS
    },

    '.__present-item-mid-part': {
      flex: 1
    },

    '.__present-item-right-part': {
      minWidth: 70
    },

    '.__present-item-percent, .__legend-item-percent': {
      color: token.colorTextLight3,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.__present-item-symbol': {
      color: token.colorTextLight1,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },

    '.__chart-area': {
      display: 'flex',
      gap: 56,
      alignItems: 'center',
      flexWrap: 'wrap'
    },

    '.__chart-wrapper': {
      padding: 4,
      height: 248,
      minWidth: 248,
      overflow: 'hidden'
    },

    '.__legend-area': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size
    },

    '.__legend-item': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__legend-item-dot': {
      width: 12,
      minWidth: 12,
      height: 12,
      borderRadius: '100%'
    },

    '.__legend-item-label': {
      color: token.colorTextLight1,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      marginLeft: token.marginSM,
      marginRight: token.marginXS
    },

    '@media (max-width: 1400px)': {
      '.__box-container': {
        gap: token.sizeLG
      },

      '.__chart-area': {
        gap: 16
      },

      '.__box-part-title': {
        marginBottom: 24
      }
    }
  };
});

export default Statistics;
