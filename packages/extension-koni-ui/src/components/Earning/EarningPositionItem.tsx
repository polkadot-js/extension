// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolType } from '@subwallet/extension-base/types';
import { BN_TEN } from '@subwallet/extension-base/utils';
import { NetworkTag } from '@subwallet/extension-koni-ui/components';
import EarningTypeTag from '@subwallet/extension-koni-ui/components/Earning/EarningTypeTag';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ExtraYieldPositionInfo, NetworkType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isRelatedToAstar } from '@subwallet/extension-koni-ui/utils';
import { Icon, Logo, Number } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { CaretRight } from 'phosphor-react';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps & {
  positionInfo: ExtraYieldPositionInfo;
  onClick?: () => void;
  isShowBalance?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { t } = useTranslation();
  const { className, isShowBalance,
    onClick,
    positionInfo } = props;
  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { asset, balanceToken, chain, currency, group, price, slug, totalStake, type } = positionInfo;

  const { poolInfoMap } = useSelector((state) => state.earning);
  const { assetRegistry, multiChainAssetMap } = useSelector((state) => state.assetRegistry);
  const poolInfo = poolInfoMap[slug];

  const showSubLogo = useMemo(() => {
    return ![YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(type);
  }, [type]);

  const poolName = useMemo(() => {
    return (multiChainAssetMap[group] || assetRegistry[group]).symbol;
  }, [assetRegistry, group, multiChainAssetMap]);

  const balanceValue = useMemo(() => {
    return new BigN(totalStake);
  }, [totalStake]);

  const convertedBalanceValue = useMemo(() => {
    return new BigN(balanceValue).div(BN_TEN.pow(asset.decimals || 0)).multipliedBy(price);
  }, [asset.decimals, balanceValue, price]);

  const _isRelatedToAstar = isRelatedToAstar(slug);

  const isTestnet = useMemo(() => {
    return chainInfoMap[positionInfo.chain].isTestnet;
  }, [chainInfoMap, positionInfo.chain]);

  return (
    <div
      className={CN(className)}
      onClick={onClick}
    >
      <div className={'__item-left-part'}>
        <Logo
          className={'__item-logo'}
          isShowSubLogo={showSubLogo}
          size={40}
          subNetwork={poolInfo.metadata.logo || poolInfo.chain}
          token={balanceToken.toLowerCase()}
        />

        <div className='__item-lines-container'>
          <div className='__item-line-1'>
            <div className='__item-name'>{poolName}</div>

            {
              !_isRelatedToAstar && (
                <div className='__item-balance-value'>
                  <Number
                    decimal={asset.decimals || 0}
                    hide={!isShowBalance}
                    suffix={asset.symbol}
                    value={balanceValue}
                  />
                </div>
              )
            }
          </div>
          <div className='__item-line-2'>
            <div className='__item-tags-container'>
              <EarningTypeTag
                chain={chain}
                className={'__item-tag'}
                type={type}
              />
              {isTestnet && <NetworkTag
                className={'__item-tag'}
                type={isTestnet ? NetworkType.TEST_NETWORK : NetworkType.MAIN_NETWORK}
              />}
            </div>

            {
              !_isRelatedToAstar && (
                <div className='__item-converted-balance-value'>
                  <Number
                    decimal={0}
                    hide={!isShowBalance}
                    prefix={(currency?.isPrefix && currency.symbol) || ''}
                    suffix={(!currency?.isPrefix && currency?.symbol) || ''}
                    value={convertedBalanceValue}
                  />
                </div>
              )
            }
          </div>
        </div>
      </div>

      <div className={'__item-right-part'}>
        {
          _isRelatedToAstar && (
            <div className={'__visit-dapp'}>
              {t('View on dApp')}
            </div>
          )
        }

        <Icon
          phosphorIcon={CaretRight}
          size='sm'
        />
      </div>
    </div>
  );
};

const EarningPositionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    cursor: 'pointer',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    display: 'flex',
    transition: `background-color ${token.motionDurationMid} ${token.motionEaseInOut}`,
    padding: token.paddingSM,

    '&:hover': {
      backgroundColor: token.colorBgInput
    },

    '.__item-left-part': {
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      flex: 1
    },

    '.__item-right-part': {
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 10,
      gap: 10
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
      marginBottom: 2
    },

    '.__item-line-2': {
      alignItems: 'flex-end'
    },

    '.__item-name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    },

    '.__item-balance-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight,
      display: 'flex'
    },

    '.__item-converted-balance-value': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.__item-balance-value, .__item-converted-balance-value': {
      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },

    '.__item-tags-container': {
      flex: 1,
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeXXS
    },

    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__visit-dapp': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    }
  });
});

export default EarningPositionItem;
