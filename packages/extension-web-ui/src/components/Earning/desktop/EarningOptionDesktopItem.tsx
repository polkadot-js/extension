// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { YieldPoolType } from '@subwallet/extension-base/types';
import NetworkTag from '@subwallet/extension-web-ui/components/NetworkTag';
import { useSelector, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { NetworkType, ThemeProps, YieldGroupInfo } from '@subwallet/extension-web-ui/types';
import { Button, Icon, Logo, Number } from '@subwallet/react-ui';
import { PlusCircle } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  poolGroup: YieldGroupInfo;
  onClick?: () => void;
  isShowBalance?: boolean;
  chain: _ChainInfo;
  displayBalanceInfo?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, displayBalanceInfo = true, isShowBalance, onClick, poolGroup } = props;
  const { t } = useTranslation();
  const { currencyData } = useSelector((state: RootState) => state.price);
  const { poolInfoMap } = useSelector((state) => state.earning);
  const { balance, isTestnet, maxApy, poolSlugs, symbol, token, totalValueStaked } = poolGroup;

  const isNotShowPrefix = poolSlugs.every((slug) => {
    const poolInfo = poolInfoMap[slug];

    return [YieldPoolType.NOMINATION_POOL, YieldPoolType.NATIVE_STAKING].includes(poolInfo?.type);
  });

  return (
    <div
      className={className}
      onClick={onClick}
    >
      <div className={'__item-content-wrapper'}>
        <Logo
          size={64}
          token={token.toLowerCase()}
        />

        <div className={'__item-info-wrapper'}>
          <div className={'__item-token-symbol'}>{symbol}
            {chain.slug === 'bifrost' && (
              <span className={'__chain-wrapper'}>
                  (<span className={'__chain'}>
                  {chain.name}
                </span>)
              </span>
            )}
            {isTestnet && <div className={'__item-tag-wrapper'}>
              <NetworkTag
                className={'__item-tag'}
                type={isTestnet ? NetworkType.TEST_NETWORK : NetworkType.MAIN_NETWORK}
              />
            </div>}
          </div>

          {
            displayBalanceInfo && (
              <div className='__item-available-balance-wrapper'>
                <div className='__item-available-balance-label'>
                  {t('Available')}:
                </div>
                <Number
                  className={'__item-available-balance-value'}
                  decimal={0}
                  hide={!isShowBalance}
                  suffix={symbol}
                  value={balance.value}
                />
              </div>
            )
          }
        </div>

        <div className={'__item-apy'}>
          {
            !maxApy
              ? <div className={'__item-apy-not-available'}>TBD</div>
              : (
                <>
                  {!isNotShowPrefix && <span className={'__item-apy-prefix'}>Up to</span>}
                  <Number
                    className={'__item-apy-value'}
                    decimal={0}
                    size={30}
                    suffix={'%'}
                    value={maxApy}
                  />
                </>
              )
          }
          <div className={'__item-apy-sub-text'}>{t('per year')}</div>
        </div>

        <div className={'__item-total-stake-wrapper'}>
          <div className='__item-total-stake-label'>{t('Total value staked')}:</div>

          <Number
            className={'__item-total-stake-value'}
            decimal={0}
            prefix={(currencyData?.isPrefix && currencyData?.symbol) || ''}
            value={totalValueStaked}
          />
        </div>

        <div className='__item-button'>
          <Button
            icon={(
              <Icon
                className={'__item-button-icon'}
                phosphorIcon={PlusCircle}
                size='sm'
                weight='fill'
              />
            )}
            shape='circle'
            size='xs'
          >
            {'Stake to earn'}
          </Button>
        </div>
      </div>
    </div>
  );
};

const EarningOptionDesktopItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    cursor: 'pointer',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    padding: `${token.paddingXL}px ${token.paddingLG}px ${token.padding}px`,

    '&:hover': {
      backgroundColor: token.colorBgInput
    },

    '.__item-content-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.padding,
      alignItems: 'center'
    },
    '.__item-tag': {
      marginRight: 0,
      'white-space': 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      minWidth: 70
    },

    '.__item-info-wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      alignItems: 'center'
    },

    '.__item-token-symbol': {
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: 600,
      color: token.colorTextLight1,
      textAlign: 'center',
      display: 'flex',
      alignItems: 'center',
      gap: 8
    },

    '.__item-available-balance-wrapper': {
      display: 'flex',
      alignItems: 'center',
      whitespace: 'nowrap',
      color: token.colorTextSecondary
    },

    '.__item-available-balance-label': {
      paddingRight: 4,
      fontSize: token.fontSizeSM
    },

    '.__item-apy-value': {
      fontSize: token.fontSizeHeading2,
      fontWeight: token.fontWeightStrong,
      lineHeight: token.lineHeightHeading2,
      '.ant-number-integer': {
        fontWeight: 'inherit !important',
        fontSize: 'inherit !important',
        lineHeight: token.lineHeightHeading2
      },
      '.ant-number-decimal, .ant-number-suffix': {
        fontSize: `${token.fontSizeHeading2}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightHeading2
      }
    },

    '.__item-available-balance-value': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      fontWeight: token.bodyFontWeight,
      color: token.colorTextSecondary,

      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix': {
        color: `${token.colorTextSecondary} !important`,
        fontSize: `${token.fontSizeSM}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeightSM
      }
    },

    '.__item-apy': {
      display: 'flex',
      gap: token.paddingXS,
      fontWeight: token.fontWeightStrong
    },

    '.__item-apy-not-available': {
      fontSize: token.fontSizeHeading2,
      lineHeight: token.lineHeightHeading2
    },

    '.__item-apy-sub-text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight4,
      display: 'flex',
      alignItems: 'flex-end'
    },

    '.__item-apy-prefix': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight4,
      paddingTop: 3
    },

    '.__item-total-stake-wrapper': {
      display: 'flex',
      justifyContent: 'center',
      gap: 4,
      alignItems: 'center'
    },

    '.__item-total-stake-label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      color: token.colorTextLight4,
      fontWeight: token.fontWeightStrong
    },
    '.__item-total-stake-value': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeightStrong,
      color: token.colorSuccess,

      '.ant-number-integer': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      },

      '.ant-number-decimal, .ant-number-suffix, .ant-number-prefix': {
        color: `${token.colorSuccess} !important`,
        fontSize: `${token.fontSizeHeading6}px !important`,
        fontWeight: 'inherit !important',
        lineHeight: token.lineHeight
      }
    },
    // todo recheck
    '.earning-item-not-available-info': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      color: token.colorSuccess
    },

    '.__item-button': {
      display: 'flex',
      gap: token.padding,
      justifyContent: 'center',
      paddingTop: token.paddingLG,
      paddingBottom: token.padding
    },
    '.__item-tag-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.__item-button-icon': {
      width: token.sizeMD,
      height: token.sizeMD
    }
  });
});

export default EarningOptionDesktopItem;
