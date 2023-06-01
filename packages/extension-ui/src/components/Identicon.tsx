// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';
import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import Icon from '@polkadot/react-identicon';

interface Props {
  className?: string;
  iconTheme?: IconTheme;
  isExternal?: boolean | null;
  prefix?: number;
  value?: string | null;
}

function Identicon({ className, iconTheme, prefix, value }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Icon
        className='icon'
        prefix={prefix}
        size={64}
        theme={iconTheme}
        value={value}
      />
    </div>
  );
}

export default styled(Identicon)(
  ({ theme }: ThemeProps) => `
  border-radius: 50%;
  display: flex;
  justify-content: center;
  border: 1px solid ${theme.avatarBorderColor};
  overflow: hidden;

  /* Identicon copies address on click - this prevents onClick from firing */
  pointer-events: none;

  .container:before {
    box-shadow: none;
    background: ${theme.identiconBackground};
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }

`
);
