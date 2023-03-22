// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import arrowLeft from '../assets/arrow-left.svg';
import Button from './Button';
import Svg from './Svg';

interface Props {
  className?: string;
  onClick: () => void;
}

function BackButton({ className, onClick }: Props): React.ReactElement<Props> {
  return (
    <Button
      className={className}
      onClick={onClick}
      secondary
    >
      <Svg
        className='arrowLeft'
        src={arrowLeft}
      />
    </Button>
  );
}

export default styled(BackButton)(
  ({ theme }: ThemeProps) => `
  background: ${theme.buttonSecondaryBackground};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 13px 24px;
  gap: 8px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-right: 11px;
  width: 42px;

  .arrowLeft {
    background: ${theme.subTextColor};
    display: block;
    width: 20px;
    height: 20px;
  }

  &:not(:disabled):hover {
    background: ${theme.buttonSecondaryBackgroundHover};
    box-shadow: ${theme.buttonSecondaryBackgroundHover};
  }
`
);
