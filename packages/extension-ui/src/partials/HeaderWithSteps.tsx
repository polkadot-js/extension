// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import Header from './Header';

interface Props {
  step: number;
  text: string;
  total: number;
  withBackArrow?: boolean;
  withBackdrop?: boolean;
}

interface StepProps extends ThemeProps {
  previous: boolean;
  current: boolean;
  gap: number;
  total: number;
}

const Step = styled.div<StepProps>`
  background-color: ${({ current, previous, theme }: StepProps) =>
    previous ? theme.headerStepDone : current ? theme.headerStepCurrent : theme.headerStepToDo};
  height: 2px;
  width: ${({ total }) => `calc(100%/${total})`};
  display: inline-block;
`;

const Steps = styled.div`
  display: flex;
  justify-content: center;
  margin: 0px -16px 0;
  gap: 8px;
  position: sticky;
  top: 56px;

  :first-child {
    margin-left: 0px;
  }

  :last-child {
    margin-right: 0px;
  }
`;

function HeaderWithSteps({ step, text, total, withBackArrow = false, withBackdrop }: Props): React.ReactElement<Props> {
  return (
    <>
      <Header
        text={text}
        withBackArrow={withBackArrow}
        withBackdrop={withBackdrop}
        withHelp
        withStepper
      ></Header>
      <Steps>
        {Array.from({ length: total }, (_, i) => (
          <Step
            current={step === i + 1}
            gap={8}
            key={i}
            previous={step > i + 1}
            total={total}
          />
        ))}
      </Steps>
    </>
  );
}

export default React.memo(HeaderWithSteps);
