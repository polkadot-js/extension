// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  src: string;
}

const Svg = ({ className }: Props) => <span className={`Comp--Svg ${className}`} />;

export default styled(Svg)<Props>(({ src }) => `
  background: var(--textColor);
  display: inline-block;
  mask: url(${src});
  mask-size: cover;
`);
