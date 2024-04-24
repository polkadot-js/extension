// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { NetworkTag } from '@subwallet/extension-koni-ui/components';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { NetworkType, ThemeProps, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { isRelatedToAstar } from '@subwallet/extension-koni-ui/utils';
import { Icon, Logo, Number } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretRight } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & {
  poolGroup: YieldGroupInfo;
  onClick?: () => void;
  isShowBalance?: boolean;
  chain: _ChainInfo;
}

const Component: React.FC<Props> = (props: Props) => {
  const { chain, className, isShowBalance, onClick, poolGroup } = props;
  const { t } = useTranslation();

  const { balance, group, isTestnet, maxApy, symbol, token } = poolGroup;

  const _isRelatedToAstar = isRelatedToAstar(group);

  return (
    <div
      className={CN(className)}
      onClick={onClick}
    >
      <div className={'__item-left-part'}>
        <Logo
          className={'__item-logo'}
          size={40}
          token={token.toLowerCase()}
        />

        <div className='__item-lines-container'>
          <div className='__item-line-1'>
            <div className='__item-name'>
              <span className={'__symbol'}>
                {symbol}
              </span>

              {chain.slug === 'bifrost' && (
                <span className={'__chain-wrapper'}>
                  (<span className={'__chain'}>
                    {chain.name}
                  </span>)
                </span>
              )}
              {isTestnet && <NetworkTag
                className={'__item-tag'}
                type={isTestnet ? NetworkType.TEST_NETWORK : NetworkType.MAIN_NETWORK}
              />}
            </div>

            {
              !_isRelatedToAstar && !!maxApy && (
                <div className='__item-upto'>
                  <div className='__item-upto-label'>
                    {t('Up to')}:
                  </div>
                  <div className='__item-upto-value'>
                    <Number
                      decimal={0}
                      suffix={'%'}
                      value={maxApy}
                    />
                  </div>
                </div>
              )
            }
          </div>
          <div className='__item-line-2'>
            <div className='__item-available-balance'>
              <div className='__item-available-balance-label'>
                {t('Available')}:
              </div>
              <div className={'__item-available-balance-value'}>
                <Number
                  decimal={0}
                  hide={!isShowBalance}
                  suffix={symbol}
                  value={balance.value}
                />
              </div>
            </div>
            {
              !_isRelatedToAstar && !!maxApy && (
                <div className='__item-time'>
                  {t('per year')}
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

const EarningOptionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
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
      marginBottom: token.marginXXS
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

    '.__item-upto-label, .__item-available-balance-label': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      display: 'flex'
    },

    '.__item-available-balance': {
      display: 'flex',
      gap: token.sizeXXS
    },

    '.__item-upto': {
      display: 'flex',
      alignItems: 'baseline',
      'white-space': 'nowrap',
      gap: token.sizeXXS
    },

    '.__item-upto-value': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1,
      fontWeight: token.headingFontWeight
    },

    '.__item-time': {
      color: token.colorSuccess,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    },

    '.__item-upto-value, .__item-available-balance-value': {
      '.ant-number, .ant-typography': {
        color: 'inherit !important',
        fontSize: 'inherit !important',
        fontWeight: 'inherit !important',
        lineHeight: 'inherit'
      }
    },

    '.__item-available-balance-value': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.__visit-dapp': {
      color: token.colorTextLight4,
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM
    }
  });
});

export default EarningOptionItem;
