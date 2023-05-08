// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

type Props = {
  className?: string;
  activeStepsCount: number;
  stepCount: number;
  activeColor: string;
  inactiveColor: string;
}

function ProgressBar({
  activeColor,
  activeStepsCount,
  className,
  inactiveColor,
  stepCount,
}: Props): React.ReactElement {
  return (
    <Container className={className}>
      {Array.from(
        {length: stepCount},
        (_, index) => (
          <Dash
            $color={activeStepsCount > index ? activeColor : inactiveColor}
            key={index}
          />
        ))
      }
    </Container>
  );
}

const Container = styled.div`
  display: flex;
`;

const Dash = styled.div<{$color: string}>`
  transition: background-color 0.4s ease;
  background-color: ${({$color}) => $color};
  height: 2px;
  flex-grow: 1;
  margin: 0 2.5px;

  &:first-child {
    margin-left: 5px;
  }

  &:last-child {
    margin-right: 5px;
  }
`;

export default ProgressBar;
