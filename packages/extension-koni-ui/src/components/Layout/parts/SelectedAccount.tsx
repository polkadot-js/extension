// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import Icon from '@subwallet/react-ui/es/icon';
import SwAvatar from '@subwallet/react-ui/es/sw-avatar';
import { CaretDown } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

const PLACEHOLDER_NAME = 'Account 1';
const PLACEHOLDER_ADDRESS = '5DnokDpMdNEH8cApsZoWQnjsggADXQmGWUb6q8ZhHeEwvncL';

// todo: this is placeholder component. Wait S2kael task for proper component
const Component = ({ className }: ThemeProps) => {
  return (
    <div className={className}>
      <div className={'__item'}>
        <SwAvatar
          identPrefix={42}
          isShowSubIcon={false}
          size={20}
          value={PLACEHOLDER_ADDRESS}
        />
      </div>
      <div className={'__item __text __name'}>{PLACEHOLDER_NAME}</div>
      <div className={'__item __text __address'}>(...{PLACEHOLDER_ADDRESS.substring(PLACEHOLDER_ADDRESS.length - 3)})</div>
      <div className={'__item __icon'}>
        <Icon
          customSize={'12px'}
          phosphorIcon={CaretDown}
          type='phosphor'
        />
      </div>
    </div>
  );
};

const SelectedAccount = styled(Component)<ThemeProps>(({ theme: { token } }: ThemeProps) => {
  return ({
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',

    '.__item': {
      paddingLeft: token.paddingXXS,
      paddingRight: token.paddingXXS
    },

    '.__text': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG
    },

    '.__name': {
      color: token.colorTextLight1
    },

    '.__address, .__icon': {
      color: token.colorTextLight4
    }
  });
});

export { SelectedAccount };
