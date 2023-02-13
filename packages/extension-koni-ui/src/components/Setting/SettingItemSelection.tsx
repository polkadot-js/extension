// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { SettingItem } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { CheckCircle } from 'phosphor-react';
import styled, { useTheme } from 'styled-components';
import { Theme } from '@subwallet/extension-koni-ui/themes';

interface SettingItemSelectionProps {
  label: string;
  leftItemIcon?: React.ReactNode;
  isSelected?: boolean;
  className?: string;
}

function _SettingItemSelection (props: SettingItemSelectionProps): React.ReactElement<SettingItemSelectionProps> {
  const { leftItemIcon, label, isSelected, className } = props;
  const { token } = useTheme() as Theme;

  return (
    <SettingItem
      className={className}
      leftItemIcon={leftItemIcon}
      name={label}
      rightItem={isSelected && <Icon iconColor={token.colorSecondary} phosphorIcon={CheckCircle} weight='fill' size='sm' className={'__selected-icon'} />}
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
      padding: `${token.padding? token.padding -2 : 14}px ${token.paddingSM}px`
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
})
