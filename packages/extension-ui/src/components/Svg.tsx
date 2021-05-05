// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  src: string;
}

const Svg = ({ className }: Props) => <span className={className} />;

export default styled(Svg)(({ src, theme }: Props) => `
  background: ${theme.textColor};
  display: inline-block;
  mask: url(${src});
  mask-size: cover;
`);
