// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import SwAvatar, { SwAvatarProps } from '@subwallet/react-ui/es/sw-avatar';
import CN from 'classnames';
import React from 'react';
import styled, { useTheme } from 'styled-components';

import { isAddress } from '@polkadot/util-crypto';

type Props = ThemeProps & Omit<SwAvatarProps, 'value'> & {
  value?: string | null,
};

// todo: change this in react-ui then remove this component
function Component ({ className = '', size = 40, value = null, ...restProps }: Props): React.ReactElement<Props> {
  const { logoMap } = useTheme() as Theme;

  return (
    <div
      className={CN('avatar', className)}
      style={{ width: size, height: size }}
    >
      {
        (!value || !isAddress(value)) && (
          <img
            alt='logo'
            height={size * 0.7}
            src={logoMap.symbol.avatar_placeholder as string}
            width={size * 0.7}
          />
        )
      }

      <SwAvatar
        {...restProps}
        size={size}
        value={value}
      />
    </div>
  );
}

export const Avatar = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    position: 'relative',

    img: {
      display: 'block',
      position: 'absolute',
      inset: 0,
      zIndex: 5,
      margin: 'auto'
    },

    '.sub-icon': {
      zIndex: 10
    }
  });
});
