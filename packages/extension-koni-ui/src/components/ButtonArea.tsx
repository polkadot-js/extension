// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  children: React.ReactNode;
}

const ButtonArea = function ({ children, className }: Props) {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

export default styled(ButtonArea)(({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: row;
  position: sticky;
  bottom: -15px;
  margin-left: -15px;
  margin-right: -15px;
  margin-bottom: -15px;
  padding: 15px;
  background-color: ${theme.background};

  & > button:not(:last-of-type) {
    margin-right: 8px;
  }
`);
