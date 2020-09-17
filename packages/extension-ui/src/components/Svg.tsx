// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../types';

import styled from 'styled-components';

interface Props {
  src: string;
}

export default styled.span<Props>(({ src, theme }: Props & ThemeProps) => `
  background: ${theme.textColor};
  display: inline-block;
  mask: url(${src});
  mask-size: cover;
`);
