// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
}

function VerticalSpace ({ className }: Props): React.ReactElement<Props> {
  return <div className={className} />;
}

export default styled(VerticalSpace)<Props>`
  height: 100%;
`;
