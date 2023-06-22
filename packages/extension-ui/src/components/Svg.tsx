// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  src: string;
};

const Svg = ({ className }: Props) => <span className={className} />;

export default styled(Svg)`
  background: ${({ theme }) => theme.textColor};
  display: inline-block;
  mask: url(${({ src }) => src});
  mask-size: cover;
`;
