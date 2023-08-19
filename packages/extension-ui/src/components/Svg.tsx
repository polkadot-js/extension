// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';

import { styled } from '../styled.js';

interface Props {
  className?: string;
  src: string;
}

const Svg = ({ className }: Props) => <span className={className} />;

export default styled(Svg)(({ src }: Props) => `
  background: var(--textColor);
  display: inline-block;
  mask: url(${src});
  mask-size: cover;
`);
