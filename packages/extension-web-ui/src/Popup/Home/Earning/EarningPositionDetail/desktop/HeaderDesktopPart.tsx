// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { NormalYieldPoolStatistic, YieldCompoundingPeriod, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import EarningTypeTag from '../../../../../components/Earning/EarningTypeTag';

export type Props = ThemeProps & {
  poolInfo: YieldPoolInfo;
  inputAsset: _ChainAsset;
  isShowBalance: boolean;
  activeStake: BigN;
  convertActiveStake: BigN;
};

function Component ({ activeStake, className, convertActiveStake, inputAsset, isShowBalance, poolInfo }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { currencyData } = useSelector((state: RootState) => state.price);

  const totalApy = useMemo((): number | undefined => {
    return (
      poolInfo.statistic?.totalApy ||
      (poolInfo.statistic?.totalApr
        ? calculateReward(poolInfo.statistic.totalApr, undefined, YieldCompoundingPeriod.YEARLY).apy
        : undefined)
    );
  }, [poolInfo.statistic?.totalApr, poolInfo.statistic?.totalApy]);

  const unstakePeriod = useMemo((): number | undefined => {
    if (poolInfo.statistic && 'unstakingPeriod' in poolInfo.statistic) {
      return (poolInfo.statistic as NormalYieldPoolStatistic).unstakingPeriod;
    } else {
      return undefined;
    }
  }, [poolInfo.statistic]);

  const unstakePeriodNode = useMemo(() => {
    if (unstakePeriod) {
      const days = unstakePeriod / 24;

      return (
        <div className={'__unstaking-period-value-wrapper'}>
          <div className={'__unstaking-period-value'}>
            {days < 1 ? unstakePeriod : days}
          </div>
          <div className={'__unstaking-period-value-suffix'}>
            {days < 1 ? t('hours') : t('days')}
          </div>
        </div>
      );
    } else {
      return (
        <div className={'__unstaking-period-value'}>
          {t('TBD')}
        </div>
      );
    }
  }, [t, unstakePeriod]);

  return (
    <div className={CN(className, '__header-desktop-part-container')}>
      <div className={CN('__block-item', '__total-balance-block')}>
        <div className={'__block-title-wrapper'}>
          <div className={'__block-title'}>{t('Active stake')}</div>
          <div className={'__tag-earning-type'}>
            <EarningTypeTag
              chain={poolInfo.chain}
              className={'__item-tag'}
              type={poolInfo.type}
            />
          </div>
        </div>

        <div className={'__block-content'}>
          <Number
            className={'__header-active-stake-value'}
            decimal={inputAsset?.decimals || 0}
            hide={!isShowBalance}
            size={38}
            subFloatNumber={true}
            suffix={inputAsset?.symbol}
            value={activeStake}
          />

          <Number
            className={'__active-stake-converted-value'}
            decimal={0}
            hide={!isShowBalance}
            prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
            value={convertActiveStake}
          />
        </div>
      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__estimate-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Estimated earnings')}</div>
        </div>

        <div className={'__block-content'}>
          {
            totalApy !== undefined
              ? (
                <>
                  <Number
                    className='__balance-value'
                    decimal={0}
                    suffix={'%'}
                    value={totalApy}
                  />

                  <div className={'earning-item-reward-sub-text'}>{t('per year')}</div>
                </>
              )
              : (
                <div className={'__tbd'}>{t('TBD')}</div>
              )
          }
        </div>
      </div>

      <div
        className='__block-divider'
      />

      <div className={CN('__block-item', '__minimun-stake-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Minimum active stake')}</div>
        </div>

        <div className={'__block-content'}>
          <Number
            className='__active-minimum-stake-value'
            decimal={inputAsset?.decimals || 0}
            suffix={inputAsset?.symbol}
            value={poolInfo.statistic?.earningThreshold.join || '0'}
          />
        </div>
      </div>

      <div
        className='__block-divider __divider-special'
      />

      <div className={CN('__block-item', '__action-block')}>
        <div className='__block-title-wrapper'>
          <div className={'__block-title'}>{t('Unstaking period')}</div>
        </div>

        <div className={'__block-content'}>
          {poolInfo.type === YieldPoolType.LIQUID_STAKING && <span className={'__label'}>Up to</span>}
          {unstakePeriodNode}
        </div>
      </div>
    </div>
  );
}

const HeaderDesktopPart = styled(Component)<Props>(({ theme: { token } }: Props) => ({
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

  '&.__header-desktop-part-container': {
    marginBottom: token.marginXL
  },

  '.__block-title': {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    color: token.colorWhite
  },
  '.__earning-block-item > .__block-title': {
    paddingRight: 8
  },

  '.__tbd': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
    fontWeight: token.fontWeightStrong,
    color: token.colorWhite
  },

  '.__estimate-block .__block-content': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  '.__minimun-stake-block .__block-content': {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  '.__unstaking-period-value': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
    paddingRight: token.paddingXXS,
    color: token.colorWhite
  },

  '.__unstaking-period-value-suffix': {
    fontSize: token.fontSizeHeading3,
    lineHeight: token.lineHeightHeading3,
    color: token.colorTextLight4,
    fontWeight: token.fontWeightStrong
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
  '.__unstaking-period-value-wrapper': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline'
  },

  '.__unstaking-period': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2
  },

  '.__header-active-stake-value': {
    fontSize: token.fontSizeHeading1,
    lineHeight: token.lineHeightHeading1,
    fontWeight: token.fontWeightStrong,
    color: token.colorWhite,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight4} !important`,
      fontSize: `${token.fontSizeHeading3}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading3
    }
  },
  '.__active-minimum-stake-value': {
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2,
    fontWeight: token.fontWeightStrong,
    color: token.colorWhite,

    '.ant-number-integer': {
      color: 'inherit !important',
      fontSize: 'inherit !important',
      fontWeight: 'inherit !important',
      lineHeight: 'inherit'
    },

    '.ant-number-decimal, .ant-number-suffix': {
      color: `${token.colorTextLight4} !important`,
      fontSize: `${token.fontSizeHeading3}px !important`,
      fontWeight: 'inherit !important',
      lineHeight: token.lineHeightHeading3
    }
  },

  '.__earning-block-item': {
    display: 'flex'
  },
  '.earning-balance-active-stake': {
    color: token.colorTextTertiary
  },
  '.__balance-change-value': {
    marginRight: token.sizeXS,
    lineHeight: token.lineHeight
  },
  '.earning-item-reward-sub-text': {
    fontSize: token.fontSizeLG,
    lineHeight: token.lineHeightLG,
    color: token.colorTextLight4,
    paddingBottom: 6,
    display: 'block',
    alignItems: 'center'
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
    alignItems: 'center',
    flexDirection: 'row'
  },

  '.__total-balance-block': {
    '.__balance-value': {
      fontSize: 38,
      lineHeight: '46px'
    }
  },

  '.__minimun-stake-block, .__estimate-block': {
    alignItems: 'center',

    '.__balance-value': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2,
      fontWeight: token.fontWeightStrong
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
  '.__action-block .__block-content': {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'baseline'
  },

  '.__label': {
    color: token.colorTextLight4,
    paddingTop: 3,
    display: 'block',
    alignItems: 'center',
    marginRight: -token.marginXS,
    fontSize: token.fontSizeHeading2,
    lineHeight: token.lineHeightHeading2
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

  '@media screen and (max-width: 1248px)': {
    '.__total-balance-block': {
      flexBasis: 220,
      '.__header-active-stake-value': {
        fontSize: '30px !important',
        '.ant-number-decimal': {
          fontSize: '20px !important'
        }
      }
    },
    '.__estimate-block': {
      alignItems: 'center',

      '.__balance-value': {
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        fontWeight: token.fontWeightStrong
      }
    },
    '.__minimun-stake-block': {
      alignItems: 'center',

      '.__active-minimum-stake-value': {
        fontSize: token.fontSizeHeading3,
        lineHeight: token.lineHeightHeading3,
        fontWeight: token.fontWeightStrong
      }
    },
    '.__unstaking-period-value': {
      fontSize: token.fontSizeHeading3
    }
  },

  '@media screen and (max-width: 1200px)': {
    '.__action-block': {
      flexBasis: '100% !important'
    }
  }

}));

export default HeaderDesktopPart;
