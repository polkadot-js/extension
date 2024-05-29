// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { calculateReward } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo } from '@subwallet/extension-base/types';
import EarningTypeTag from '@subwallet/extension-web-ui/components/Earning/EarningTypeTag';
import { BN_TEN } from '@subwallet/extension-web-ui/constants';
import { useGetChainAssetInfo, useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Logo, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  poolInfo: YieldPoolInfo;
  onClick?: () => void;
}

const Component: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation();
  const { className, onClick, poolInfo } = props;
  const { chain, metadata, type } = poolInfo;
  const { inputAsset, logo, shortName } = metadata;
  const totalApy = poolInfo.statistic?.totalApy;
  const totalApr = poolInfo.statistic?.totalApr;
  const tvl = poolInfo.statistic?.tvl;

  const asset = useGetChainAssetInfo(inputAsset);

  const { currencyData, priceMap } = useSelector((state) => state.price);

  const apy = useMemo((): number | undefined => {
    if (totalApy) {
      return totalApy;
    }

    if (totalApr) {
      const rs = calculateReward(totalApr);

      return rs.apy;
    }

    return undefined;
  }, [totalApr, totalApy]);

  const total = useMemo((): string => {
    if (tvl && asset) {
      const priceId = asset.priceId;

      if (!priceId) {
        return '0';
      }

      const price = priceMap[priceId] || 0;

      return new BigN(tvl)
        .div(BN_TEN.pow(asset.decimals || 0))
        .multipliedBy(price)
        .toString();
    } else {
      return '';
    }
  }, [asset, priceMap, tvl]);

  return (
    <div
      className={CN(className)}
      onClick={onClick}
    >
      <div className={'__item-upper-part'}>
        <Logo
          className={'__item-logo'}
          network={logo || chain}
          size={40}
        />

        <div className='__item-lines-container'>
          <div className='__item-line-1'>
            <div className={'__item-name'}>
              <span className='__symbol'>{asset?.symbol || ''}</span>
              <span className={'__chain-wrapper'}>
                  (<span className={'__chain'}>
                  {shortName}
                </span>)
              </span>
            </div>

            {!!apy && (
              <div className='__item-rewards'>
                <div className='__item-rewards-label'>
                  {t('Rewards')}:
                </div>
                <div className='__item-rewards-value'>
                  <Number
                    decimal={0}
                    suffix={'%'}
                    value={apy}
                  />
                </div>
              </div>
            )}
          </div>

          <div className='__item-line-2'>
            <div className='__item-total-staked-label'>
              {t('Total value staked')}:
            </div>
            <div className='__item-total-staked-value'>
              {total
                ? (
                  <Number
                    decimal={0}
                    prefix={(currencyData.isPrefix && currencyData.symbol) || ''}
                    suffix={(!currencyData.isPrefix && currencyData.symbol) || ''}
                    value={total}
                  />
                )
                : (
                  <span>
                    {t('TBD')}
                  </span>
                )}
            </div>
          </div>
        </div>
      </div>
      <div className={'__item-lower-part'}>
        <div className='__item-tags-container'>
          <EarningTypeTag
            chain={chain}
            className={'__item-tag'}
            type={type}
          />
        </div>
      </div>
    </div>
  );
};

const EarningPoolItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    cursor: 'pointer',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    paddingTop: token.sizeSM,
    paddingLeft: token.sizeSM,
    paddingRight: token.sizeSM,
    paddingBottom: 0,
    transition: `background-color ${token.motionDurationMid} ${token.motionEaseInOut}`,

    '&:hover': {
      backgroundColor: token.colorBgInput
    },

    '.__item-logo': {
      marginRight: token.marginXS
    },

    '.__item-lines-container': {
      flex: 1,
      overflow: 'hidden'
    },

    '.__item-line-1, .__item-line-2': {
      'white-space': 'nowrap',
      display: 'flex',
      justifyContent: 'space-between',
      gap: token.sizeSM
    },

    '.__item-line-1': {
      marginBottom: token.marginXXS
    },

    '.__item-rewards-label, .__item-total-staked-label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__item-name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight,
      display: 'flex',
      gap: token.sizeXXS,
      overflow: 'hidden',

      '.__symbol': {
        color: token.colorTextLight1
      },

      '.__chain-wrapper': {
        overflow: 'hidden',
        display: 'flex',
        color: token.colorTextLight4
      },

      '.__chain': {
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }
    },
    '.__item-name-chain': {
      color: token.colorTextLight4,
      paddingLeft: 4
    },

    '.__item-rewards': {
      display: 'flex',
      alignItems: 'baseline',
      'white-space': 'nowrap',
      gap: token.sizeXXS
    },

    '.__item-rewards-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight
    },

    '.__item-total-staked-value': {
      color: token.colorSuccess,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.__item-rewards-value, .__item-total-staked-value': {
      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },

    '.__item-tags-container': {
      paddingTop: 8,
      paddingBottom: 8,
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeXS
    },

    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__item-upper-part': {
      display: 'flex',
      paddingBottom: token.sizeXS
    },

    '.__item-lower-part': {
      borderTop: '2px solid rgba(33, 33, 33, 0.80)',
      display: 'flex',
      alignItems: 'center'
    }
  });
});

export default EarningPoolItem;
