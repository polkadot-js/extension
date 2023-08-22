// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & SwModalProps;

function Component ({ children, className, transitionName, ...props }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const _transitionName = transitionName || (isWebUI ? 'animation-fade-to-left' : 'ant-slide-down');

  return (
    <SwModal
      {...props}
      className={CN(className, {
        '-web-ui': isWebUI,
        'animation-fade-to-left': isWebUI
      })}
      transitionName={_transitionName}
    >
      {children}
    </SwModal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BaseModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '&.-web-ui': {
      left: 'auto',

      '.ant-sw-modal-content': {
        height: '100%',
        maxHeight: '100%'
      },

      '.ant-sw-list-section .ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    }
  });
});
