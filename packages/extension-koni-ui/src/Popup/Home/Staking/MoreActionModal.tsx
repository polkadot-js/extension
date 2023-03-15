// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainStakingMetadata } from '@subwallet/extension-base/background/KoniTypes';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, SettingItem, SwModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { ArrowCircleDown, IconProps, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps & {
  chainStakingMetadata?: ChainStakingMetadata
}

export const MORE_ACTION_MODAL = 'more-action-modal';

type ActionListType = {
  backgroundIconColor: keyof GlobalToken,
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>,
  label: string,
  value: string,
}

const ACTION_LIST: ActionListType[] = [
  {
    backgroundIconColor: 'green-6',
    icon: PlusCircle,
    label: 'Stake more',
    value: '/transaction/stake'
  },
  {
    backgroundIconColor: 'magenta-6',
    icon: MinusCircle,
    label: 'Unstake funds',
    value: '/transaction/unstake'
  },
  {
    backgroundIconColor: 'geekblue-6',
    icon: ArrowCircleDown,
    label: 'Withdraw',
    value: '/transaction/withdraw'
  },
  {
    backgroundIconColor: 'green-7',
    icon: Wallet,
    label: 'Claim rewards',
    value: '/transaction/claim_rewards'
  }
  // {
  //   backgroundIconColor: 'blue-7',
  //   icon: Alarm,
  //   label: 'Compound',
  //   value: '/transaction/compound'
  // }
];

export type StakingDataOption = {
  chainStakingMetadata: ChainStakingMetadata,
  hideTabList: boolean
}

const Component: React.FC<Props> = (props: Props) => {
  const { chainStakingMetadata, className } = props;
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
      return () => navigate(item.value, { state: { chainStakingMetadata, hideTabList: true } as StakingDataOption });
    },
    [chainStakingMetadata, navigate]
  );

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
          className='action-more-item'
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
    }
  };
});

export default MoreActionModal;
