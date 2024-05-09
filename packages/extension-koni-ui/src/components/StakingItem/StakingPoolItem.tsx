// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationPoolDataType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Number, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { DotsThree } from 'phosphor-react';
import React, { SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

type Props = NominationPoolDataType & ThemeProps & {
  onClickMoreBtn: (e: SyntheticEvent) => void;
  prefixAddress?: number
}

const Component: React.FC<Props> = (props: Props) => {
  const { address, bondedAmount, className, decimals, id, isCrowded, isProfitable, name, onClickMoreBtn, prefixAddress, symbol } = props;
  const { t } = useTranslation();

  return (
    <Web3Block
      className={CN(className, { 'is-crowded': isCrowded })}
      leftItem={
        <SwAvatar
          identPrefix={prefixAddress}
          size={40}
          theme={isEthereumAddress(address) ? 'ethereum' : 'polkadot'}
          value={address}
        />
      }
      middleItem={
        <div className={'middle-item'}>
          <div className={'middle-item__name'}>
            <span>{name || `Pool #${id}`}</span>
          </div>
          <div className={'middle-item__bond-amount'}>
            <span className={'middle-item__bond-amount-label'}>{t('Staked:')}</span>
            <Number
              className={'middle-item__bond-amount-number'}
              decimal={decimals}
              decimalOpacity={0.45}
              intOpacity={0.45}
              size={12}
              suffix={symbol}
              unitOpacity={0.45}
              value={bondedAmount}
            />
            <span className={CN('middle-item__pool-earning-status', { not: !isProfitable })}>
              <span className='separator'>
                &nbsp;-&nbsp;
              </span>
              <span>
                {isProfitable ? t('Earning') : t('Not earning')}
              </span>
            </span>
          </div>
        </div>
      }

      rightItem={
        <Button
          icon={
            <Icon phosphorIcon={DotsThree} />
          }
          onClick={onClickMoreBtn}
          size='xs'
          type='ghost'
        />
      }
    />
  );
};

const StakingPoolItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.paddingSM,
    borderRadius: token.borderRadiusLG,
    background: token.colorBgSecondary,

    '&.is-crowded': {
      '.ant-web3-block-left-item, .ant-web3-block-middle-item, .right-item__select-icon': {
        opacity: 0.4
      }
    },

    '.ant-web3-block-middle-item': {
      paddingRight: token.paddingXXS
    },

    '.middle-item__name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.middle-item__bond-amount-label, .middle-item__bond-amount-number, .middle-item__pool-earning-status': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.middle-item__bond-amount-number, .middle-item__pool-earning-status': {
      textWrap: 'nowrap'
    },

    '.middle-item__pool-earning-status': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: token.colorSuccess,

      '&.not': {
        color: token.colorError
      },

      '.separator': {
        color: token.colorTextLight4
      }
    },

    '.middle-item__bond-amount-label': {
      paddingRight: token.paddingXXS
    },

    '.middle-item__bond-amount': {
      display: 'flex',
      alignItems: 'center'
    }
  };
});

export default StakingPoolItem;
