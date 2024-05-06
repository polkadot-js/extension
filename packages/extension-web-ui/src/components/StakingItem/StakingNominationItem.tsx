// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominationInfo } from '@subwallet/extension-base/background/KoniTypes';
import { useGetNativeTokenBasicInfo } from '@subwallet/extension-web-ui/hooks';
import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { formatBalance, toShort } from '@subwallet/extension-web-ui/utils';
import { Icon, Web3Block } from '@subwallet/react-ui';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  nominationInfo: NominationInfo;
  isSelected?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, isSelected, nominationInfo } = props;
  const { chain } = nominationInfo;

  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  const { decimals, symbol } = useGetNativeTokenBasicInfo(chain);

  return (
    <div
      className={CN(className)}
    >
      <Web3Block
        className={'validator-item-content'}
        leftItem={
          <SwAvatar
            size={40}
            value={nominationInfo.validatorAddress}
          />
        }
        middleItem={
          <>
            <div className={'middle-item__name-wrapper'}>
              <div className={'middle-item__name'}>{nominationInfo.validatorIdentity || toShort(nominationInfo.validatorAddress)}</div>
            </div>

            <div className={'middle-item__info'}>
              <div className={'middle-item__active-stake'}>
                <span>
                  {t('Staked:')}
                </span>
                <span>
                  &nbsp;{formatBalance(nominationInfo.activeStake, decimals)}&nbsp;
                </span>
                <span>{symbol}</span>
              </div>
            </div>
          </>
        }

        rightItem={
          isSelected &&
          (
            <Icon
              className={'right-item__select-icon'}
              iconColor={token.colorSuccess}
              phosphorIcon={CheckCircle}
              size={'sm'}
              weight={'fill'}
            />
          )
        }
      />
    </div>
  );
};

const StakingNominationItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    borderRadius: token.borderRadiusLG,
    background: token.colorBgSecondary,

    '.validator-item-content': {
      borderRadius: token.borderRadiusLG
    },

    '.ant-web3-block-middle-item': {
      paddingRight: token.padding
    },

    '.middle-item__name-wrapper': {
      display: 'flex',
      alignItems: 'center'
    },

    '.middle-item__name': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      paddingRight: token.paddingXXS,
      textOverflow: 'ellipsis',
      overflow: 'hidden',
      whiteSpace: 'nowrap'
    },

    '.middle-item__info': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight4
    },

    '.middle-item__active-stake': {
      color: token.colorTextLight4,
      paddingRight: token.paddingXXS
    },

    '.right-item__select-icon': {
      paddingLeft: token.paddingSM - 2,
      paddingRight: token.paddingSM - 2
    }
  };
});

export default StakingNominationItem;
