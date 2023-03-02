// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ThemeProps } from '../types';
import { Z_INDEX } from '../zindex';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const BottomWrapper: React.FC<Props> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default styled(BottomWrapper)`
  display: flex;
  flex-direction: column;
  position: sticky;
  bottom: 0;
  z-index: ${Z_INDEX.BOTTOM_WRAPPER};
  max-width: 375px;
`;
