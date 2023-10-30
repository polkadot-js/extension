// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwModal } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & SwModalProps & {
  fullSize?: boolean;
};

function Component ({ children, className, fullSize, motion, ...props }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const _motion = motion || (isWebUI ? 'move-right' : undefined);

  return (
    <SwModal
      {...props}
      className={CN(className, {
        '-desktop': isWebUI,
        '-mobile': !isWebUI,
        '-full-Size': fullSize
      })}
      motion={_motion}
      width={'100%'}
    >
      {children}
    </SwModal>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const BaseModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

      '.ant-sw-modal-content': {
        width: '100%',
        height: '100%',
        maxHeight: '100%',
        paddingLeft: token.paddingLG,
        paddingRight: token.paddingLG
      },

      '.ant-sw-list-section .ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    },

    '&.-mobile': {
      justifyContent: 'flex-end'
    },

    '&.-full-Size': {
      '.ant-sw-modal-content': {
        height: '100%',
        maxHeight: '100%'
      }
    }
  });
});
