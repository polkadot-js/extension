// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';
import Icon from '@polkadot/react-identicon';

interface Props {
  className?: string;
  iconTheme?: 'beachball' | 'empty' | 'jdenticon' | 'polkadot' | 'substrate';
  isExternal?: boolean | null;
  onCopy?: () => void;
  prefix?: number;
  value?: string | null;
}

function Identicon ({ className, iconTheme, onCopy, prefix, value }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <Icon
        className='icon'
        onCopy={onCopy}
        prefix={prefix}
        size={64}
        theme={iconTheme}
        value={value}
      />
    </div>
  );
}

export default styled(Identicon)(({ theme }: ThemeProps) => `
  background: rgba(192, 192, 292, 0.25);
  border-radius: 50%;
  display: flex;
  justify-content: center;

  .container:before {
    box-shadow: none;
    background: ${theme.identiconBackground};
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }
`);
