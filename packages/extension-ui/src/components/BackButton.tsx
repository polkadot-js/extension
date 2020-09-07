// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import arrowLeft from '../assets/arrowLeft.svg';
import Button from './Button';
import Svg from './Svg';

interface Props {
  className?: string;
  onClick: () => void;
}

function BackButton ({ className, onClick }: Props): React.ReactElement<Props> {
  return (
    <Button
      className={className}
      onClick={onClick}
    >
      <Svg
        className='arrowLeft'
        src={arrowLeft}
      />
    </Button>
  );
}

export default styled(BackButton)(({ theme }: ThemeProps) => `
  background: ${theme.backButtonBackground};
  margin-right: 11px;
  width: 42px;

  .arrowLeft {
    background: ${theme.backButtonTextColor};
    display: block;
    height: 12px;
    margin: auto;
    width: 12px;
  }
`);
