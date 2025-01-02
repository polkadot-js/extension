// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
}

function MenuDivider ({ className }: Props): React.ReactElement<Props> {
  return (
    <div className={className} />
  );
}

export default styled(MenuDivider)<Props>`
  padding-top: 16px;
  margin-bottom: 16px;
  border-bottom: 1px solid var(--inputBorderColor);
`;
