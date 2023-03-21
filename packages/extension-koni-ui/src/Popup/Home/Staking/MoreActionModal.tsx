// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata, NominatorMetadata, StakingItem, StakingRewardItem } from '@subwallet/extension-base/background/KoniTypes';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, ModalContext, SettingItem, SwModal } from '@subwallet/react-ui';
import { ArrowArcLeft, ArrowCircleDown, IconProps, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata;
  nominatorMetadata?: NominatorMetadata;
}

export const MORE_ACTION_MODAL = 'more-action-modal';

type ActionListType = {
  backgroundIconColor: keyof GlobalToken,
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>,
  label: string,
  value: string,
  action: string
}

const ACTION_LIST: ActionListType[] = [
  {
    backgroundIconColor: 'green-6',
    icon: PlusCircle,
    label: 'Stake more',
    value: '/transaction/stake',
    action: 'stake'
  },
  {
    backgroundIconColor: 'magenta-6',
    icon: MinusCircle,
    label: 'Unstake funds',
    value: '/transaction/unstake',
    action: 'unstake'
  },
  {
    backgroundIconColor: 'geekblue-6',
    icon: ArrowCircleDown,
    label: 'Withdraw',
    value: '/transaction/withdraw',
    action: 'withdraw'
  },
  {
    backgroundIconColor: 'green-7',
    icon: Wallet,
    label: 'Claim rewards',
    value: '/transaction/claim-reward',
    action: 'claim-reward'
  },
  {
    backgroundIconColor: 'purple-8',
    icon: ArrowArcLeft,
    label: 'Cancel unstake',
    value: '/transaction/cancel-unstake',
    action: 'cancel-unstake'
  }
  // {
  //   backgroundIconColor: 'blue-7',
  //   icon: Alarm,
  //   label: 'Compound',
  //   value: '/transaction/compound'
  // }
];

export type StakingDataOption = {
  staking?: StakingItem;
  reward?: StakingRewardItem;
  chainStakingMetadata?: ChainStakingMetadata,
  nominatorMetadata?: NominatorMetadata,
  hideTabList?: boolean
}

const Component: React.FC<Props> = (props: Props) => {
  const { chainStakingMetadata, className, nominatorMetadata, reward, staking } = props;
  const { inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  const onCancel = useCallback(
    () => {
      inactiveModal(MORE_ACTION_MODAL);
    },
    [inactiveModal]
  );

  const onPressItem = useCallback(
    (item: ActionListType) => {
      return () => navigate(item.value, { state: { chainStakingMetadata, nominatorMetadata, staking, reward, hideTabList: true } as StakingDataOption });
    },
    [chainStakingMetadata, navigate, nominatorMetadata, reward, staking]
  );

  const availableActions = useCallback(() => {
    const result: string[] = [];

    return result;
  }, []);

  return (
    <SwModal
      className={className}
      closable={true}
      id={MORE_ACTION_MODAL}
      maskClosable={true}
      onCancel={onCancel}
      title={t('Actions')}
    >
      {ACTION_LIST.map((item) => (
        <SettingItem
          className={`action-more-item ${availableActions().includes(item.action) ? '' : 'disabled'}`}
          key={item.label}
          leftItemIcon={<BackgroundIcon
            backgroundColor={token[item.backgroundIconColor] as string}
            phosphorIcon={item.icon}
            size={'sm'}
            weight='fill'
          />}
          name={item.label}
          onPressItem={onPressItem(item)}
        />
      ))}
    </SwModal>
  );
};

const MoreActionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.action-more-item:not(:last-child)': {
      marginBottom: token.marginXS
    },

    '.disabled': {
      cursor: 'not-allowed'
    }
  };
});

export default MoreActionModal;
