// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { IconTheme } from '@polkadot/react-identicon/types';

import React from 'react';

import { Identicon as Icon } from '@polkadot/react-identicon';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  iconTheme?: IconTheme;
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

export default styled(Identicon)<Props>`
  background: rgba(192, 192, 292, 0.25);
  border-radius: 50%;
  display: flex;
  justify-content: center;

  .container:before {
    box-shadow: none;
    background: var(--identiconBackground);
  }

  svg {
    circle:first-of-type {
      display: none;
    }
  }
`;
