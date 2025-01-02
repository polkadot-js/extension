// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ButtonProps } from './Button.js';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';

import { styled } from '../styled.js';
import Button from './Button.js';

function NextStepButton ({ children, ...props }: ButtonProps): React.ReactElement<ButtonProps> {
  return (
    <Button {...props}>
      {children}
      <FontAwesomeIcon
        className='arrowRight'
        icon={faArrowRight}
        size='sm'
      />
    </Button>
  );
}

export default styled(NextStepButton)<ButtonProps>`
  .arrowRight{
    float: right;
    margin-top: 4px;
    margin-right: 1px;
    color: var(--buttonTextColor);
  }
`;
