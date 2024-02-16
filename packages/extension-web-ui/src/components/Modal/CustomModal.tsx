// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { SwModal } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & SwModalProps & {
  children: React.ReactElement
}

function Component ({ children, ...props }: Props): React.ReactElement<Props> {
  return (
    <SwModal
      {...props}
    >
      {children}
    </SwModal>
  );
}

export const CustomModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({

    '.ant-sw-modal-content': {
      maxHeight: '100%'
    },

    '.ant-sw-modal-body': {
      paddingBottom: token.paddingSM + 4
    },

    '.ant-sw-modal-footer': {
      borderTop: 0
    },

    '.__option-item': {
      display: 'flex'
    },

    '.ant-checkbox-wrapper': {
      display: 'flex',
      alignItems: 'center'
    }
  });
});
