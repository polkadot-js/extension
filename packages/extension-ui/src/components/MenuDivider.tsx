// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types.js';

import React from 'react';

import { styled } from '../styled.js';

interface Props extends ThemeProps {
  className?: string;
}

function MenuDivider ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className} />
  );
}

export default styled(MenuDivider)`
  padding-top: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--inputBorderColor);
`;
