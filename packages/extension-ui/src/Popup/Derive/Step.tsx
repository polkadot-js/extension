// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import { Header } from '../../partials';

interface Props {
  className?: string;
  step: number;
}

function Step ({ className, step }: Props): React.ReactElement<Props> {
  return (
    <Header
      className={className}
      showBackArrow
      text={
        <>
          <span>Derive new account</span>
          <CurrentStep>{step}</CurrentStep>
          <TotalSteps>/2</TotalSteps>
        </>
      }
    />
  );
}

const CurrentStep = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.primaryColor};
  font-weight: 600;
  margin-left: 10px;
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.textColor};
  font-weight: 600;
`;

export default Step;
