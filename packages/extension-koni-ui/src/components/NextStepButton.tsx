// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import Button from '@polkadot/extension-koni-ui/components/Button';

import next from '../assets/caret-right.svg';

type Props = React.ComponentProps<typeof Button>;

function NextStepButton ({ children, ...props }: Props): React.ReactElement<Props> {
  return (
    <Button {...props}>
      {children}
      <img
        alt='next'
        className='next-step-btn__arrow-right'
        src={next}
      />
    </Button>
  );
}

export default styled(NextStepButton)(({ theme }: Props) => `
  .next-step-btn__arrow-right {
    position: absolute;
    top: 4px;
    right: 0;
    color: ${theme.buttonTextColor};
  }
`);
