// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { SwModal } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import CN from 'classnames';
import React, { useContext } from 'react';
import styled from 'styled-components';

type Props = ThemeProps & SwModalProps & {
  fullSizeOnMobile?: boolean;
  center?: boolean;
};

function Component ({ center, children, className, fullSizeOnMobile, motion, width, ...props }: Props): React.ReactElement<Props> {
  const { isWebUI } = useContext(ScreenContext);

  const _motion = motion || (isWebUI && !center ? 'move-right' : undefined);
  const _width = width || (center ? (!isWebUI ? '100%' : undefined) : '100%');

  return (
    <SwModal
      {...props}
      className={CN(className, {
        '-desktop': isWebUI && !center,
        '-mobile': !isWebUI,
        '-full-size-on-mobile': fullSizeOnMobile
      })}
      motion={_motion}
      width={_width}
    >
      {children}
    </SwModal>
  );
}

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
