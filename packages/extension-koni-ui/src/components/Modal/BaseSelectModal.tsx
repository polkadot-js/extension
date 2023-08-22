// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SelectModal, SelectModalProps } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = ThemeProps & SelectModalProps<any>;

function Component ({ children, className, transitionName, ...props }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const _transitionName = transitionName || (isWebUI ? 'animation-fade-to-left' : 'ant-slide-down');

  return (
    <>
      <SelectModal
        {...props}
        className={CN(className, {
          '-web-ui': isWebUI,
          'animation-fade-to-left': isWebUI
        })}
        transitionName={_transitionName}
      >
        {children}
      </SelectModal>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BaseSelectModal = styled(Component)(({ theme: { token } }: ThemeProps) => {
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
