// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import Button from './Button';

type Props = React.ComponentProps<typeof Button>;

function NextStepButton ({ children, ...props }: Props): React.ReactElement<Props> {
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

export default styled(NextStepButton)(({ theme }: ThemeProps) => `
  .arrowRight{
    float: right;
    margin-top: 4px;
    margin-right: 1px;
    color: ${theme.buttonTextColor};
  }
`);
