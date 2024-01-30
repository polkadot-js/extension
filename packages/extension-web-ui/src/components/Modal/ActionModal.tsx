// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { BackgroundIcon, SettingItem, SwIconProps } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

export type ActionItemType = {
  key: string,
  icon: SwIconProps['phosphorIcon'],
  iconBackgroundColor: string,
  title: string,
  onClick?: () => void
};

type Props = ThemeProps & {
  id: string,
  onCancel: () => void,
  title: string,
  actions: ActionItemType[]
}

function Component ({ actions, className = '', id, onCancel, title }: Props): React.ReactElement<Props> {
  return (
    <BaseModal
      className={className}
      id={id}
      onCancel={onCancel}
      title={title}
    >
      <div className={'__items-container'}>
        {
          actions.map((item) => (
            <SettingItem
              className={`__action-item ${item.key}`}
              key={item.key}
              leftItemIcon={(
                <BackgroundIcon
                  backgroundColor={item.iconBackgroundColor}
                  phosphorIcon={item.icon}
                  size='sm'
                  type='phosphor'
                  weight='fill'
                />
              )}
              name={item.title}
              onPressItem={item.onClick}
            />
          ))
        }
      </div>
    </BaseModal>
  );
}

export const ActionModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.__action-item + .__action-item': {
      marginTop: token.marginXS
    }
  });
});
