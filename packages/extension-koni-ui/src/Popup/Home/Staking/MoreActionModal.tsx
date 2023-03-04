// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, SettingItem, SwModal } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { Alarm, ArrowCircleDown, IconProps, MinusCircle, PlusCircle, Wallet } from 'phosphor-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps

export const MORE_ACTION_MODAL = 'more-action-modal';

type ActionListType = {
  backgroundIconColor: string,
  icon: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>,
  label: string,
  value: string,
}

const ACTION_LIST: ActionListType[] = [
  {
    backgroundIconColor: 'green-6',
    icon: PlusCircle,
    label: 'Stake more',
    value: '/'
  },
  {
    backgroundIconColor: 'magenta-6',
    icon: MinusCircle,
    label: 'Unstake funds',
    value: '/'
  },
  {
    backgroundIconColor: 'geekblue-6',
    icon: ArrowCircleDown,
    label: 'Withdraw',
    value: '/'
  },
  {
    backgroundIconColor: 'green-7',
    icon: Wallet,
    label: 'Claim rewards',
    value: '/'
  },
  {
    backgroundIconColor: 'blue-7',
    icon: Alarm,
    label: 'Compound',
    value: '/'
  }
];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { inactiveModal } = useContext(ModalContext);
  const { token } = useTheme() as Theme;
  const { t } = useTranslation();

  return (
    <SwModal
      className={className}
      closable={true}
      maskClosable={true}
      title={t('Actions')}
      id={MORE_ACTION_MODAL}
      // eslint-disable-next-line react/jsx-no-bind
      onCancel={() => inactiveModal(MORE_ACTION_MODAL)}

    >
      {ACTION_LIST.map((item) => (
        <SettingItem
          className='action-more-item'
          key={item.label}
          leftItemIcon={<BackgroundIcon
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            backgroundColor={token[`${item.backgroundIconColor}`]}
            phosphorIcon={item.icon}
            size={'sm'}
            weight='fill'
          />}
          name={item.label}
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
