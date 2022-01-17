// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0
import React from 'react';
import styled from 'styled-components';
import next from "@polkadot/extension-koni-ui/assets/caret-right.svg";
import Button from "@polkadot/extension-koni-ui/components/Button";

type Props = React.ComponentProps<typeof Button>;

function NextStepButton ({ children, ...props }: Props): React.ReactElement<Props> {
  return (
    <Button {...props}>
      {children}
      <img src={next} alt='next'
        className='next-step-btn__arrow-right'
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
