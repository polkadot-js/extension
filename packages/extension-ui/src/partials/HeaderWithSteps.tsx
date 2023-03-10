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
}

interface StepProps extends ThemeProps {
  current: boolean;
  gap: number;
  total: number;
}

const Step = styled.div<StepProps>`
  background-color: ${({ current, theme }: StepProps) => (current ? theme.stepsActiveColor : theme.stepsInactiveColor)};
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

function HeaderWithSteps({ step, text, total, withBackArrow = false }: Props): React.ReactElement<Props> {
  return (
    <>
      <Header
        text={text}
        withBackArrow={withBackArrow}
        withHelp
        withStepper
      ></Header>
      <Steps>
        {Array.from({ length: total }, (_, i) => (
          <Step
            current={step === i + 1}
            gap={8}
            key={i}
            total={total}
          />
        ))}
      </Steps>
    </>
  );
}

export default React.memo(HeaderWithSteps);
