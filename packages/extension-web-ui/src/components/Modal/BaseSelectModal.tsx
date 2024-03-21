// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { SelectModal, SelectModalProps } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Props = ThemeProps & SelectModalProps<any> & {
  fullSizeOnMobile?: boolean;
};

function Component ({ children, className, fullSizeOnMobile = true, motion, ...props }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const _motion = motion || (isWebUI ? 'move-right' : undefined);

  return (
    <>
      <SelectModal
        {...props}
        className={CN(className, {
          '-desktop': isWebUI,
          '-mobile': !isWebUI,
          '-full-size-on-mobile': fullSizeOnMobile
        },
        _motion === 'move-right' && [
          'ant-move-right-enter',
          'ant-move-right-enter-active'
        ]
        )}
        motion={_motion}
        width={'100%'}
      >
        {children}
      </SelectModal>
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BaseSelectModal = styled(Component)(({ theme: { token } }: ThemeProps) => {
  return ({
    '.ant-sw-modal-content.ant-sw-modal-content': {
      width: '100%'
    },

    '&.-desktop': {
      left: 'auto',
      right: token.paddingLG,
      bottom: token.paddingLG,
      top: token.paddingLG,
      maxWidth: 404,
      animationDuration: '0.45s',

      '.ant-sw-modal-content': {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        paddingLeft: token.paddingLG,
        paddingRight: token.paddingLG,
        borderRadius: '8px 0 0 8px'
      },

      '.ant-sw-list-section .ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    },

    '&.-mobile': {
      justifyContent: 'flex-end',

      '.ant-sw-modal-content': {
        maxHeight: '95%',
        height: 'auto'
      }
    },

    '&.-mobile.-full-size-on-mobile': {
      '.ant-sw-modal-content': {
        height: '100%',
        maxHeight: '100%',
        borderRadius: 0
      }
    }
  });
});
