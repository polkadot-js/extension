// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const ButtonArea = function ({ children, className }: Props) {
  return <div className={className}>{children}</div>;
};

export default styled(ButtonArea)(
  () => `
  display: flex;
  flex-direction: row;
  margin-bottom: 16px;
  margin-left: 0;
  margin-right: 0;

  & > button:not(:last-of-type) {
    margin-right: 16px;
  }
`
);
