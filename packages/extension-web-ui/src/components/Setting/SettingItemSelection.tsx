// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from '@subwallet/extension-web-ui/themes';
import { Icon, SettingItem } from '@subwallet/react-ui';
import { CheckCircle } from 'phosphor-react';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface SettingItemSelectionProps {
  label: string;
  leftItemIcon?: React.ReactNode;
  isSelected?: boolean;
  className?: string;
  onClickItem?: () => void;
}

function _SettingItemSelection (props: SettingItemSelectionProps): React.ReactElement<SettingItemSelectionProps> {
  const { className, isSelected, label, leftItemIcon, onClickItem } = props;
  const { token } = useTheme() as Theme;

  return (
    <SettingItem
      className={className}
      leftItemIcon={leftItemIcon}
      name={label}
      onPressItem={onClickItem}
      rightItem={isSelected && <Icon
        className={'__selected-icon'}
        iconColor={token.colorSecondary}
        phosphorIcon={CheckCircle}
        size='sm'
        weight='fill'
      />}
    />
  );
}

export const SettingItemSelection = styled(_SettingItemSelection)<SettingItemSelectionProps>(({ theme }) => {
  const { token } = theme as Theme;

  return ({
    '.ant-setting-item-name': {
      textAlign: 'initial'
    },

    '.ant-setting-item-content': {
      padding: `${token.padding ? token.padding - 2 : 14}px ${token.paddingSM}px`
    },

    '.add-account-modal-right-icon': {
      position: 'absolute',
      insetInlineEnd: 8,
      top: 10
    },

    '.__selected-icon': {
      paddingRight: 8
    }
  });
});
