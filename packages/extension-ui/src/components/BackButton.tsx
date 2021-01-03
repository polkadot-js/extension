// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import Button from './Button';

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
      <FontAwesomeIcon
        className='arrowLeft'
        icon={faArrowLeft}
        size='sm'
      />
    </Button>
  );
}

export default styled(BackButton)(({ theme }: ThemeProps) => `
  background: ${theme.backButtonBackground};
  margin-right: 11px;
  width: 42px;

  .arrowLeft {
    color: ${theme.backButtonTextColor};
    display: block;
    margin: auto;
  }

  &:not(:disabled):hover {
    background: ${theme.backButtonBackgroundHover};
  }
`);
