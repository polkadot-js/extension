// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Button from '@subwallet/extension-koni-ui/components/Button';
import React from 'react';
import styled from 'styled-components';

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

export default styled(NextStepButton)`
  .next-step-btn__arrow-right {
    position: absolute;
    margin: auto 0;
    top: 0;
    bottom: 0;
    right: -2px;
  }
`;
