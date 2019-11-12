// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { ActionText } from '@polkadot/extension-ui/components';

interface Props {
  step: number;
  onClick: () => void;
  className?: string;
}

const Title = styled.span`
  margin-right: 10px;
  font-weight: 800;
  font-size: 10px;
  line-height: 14px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  opacity: 0.65;
  color: ${({ theme }): string => theme.color}
`;

const CurrentStep = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.primaryColor}
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.color}
`;

function CreationStep ({ step, onClick, className }: Props): React.ReactElement<Props> {
  return <div className={className}>
    <div>
      <Title>Create an account:</Title>
      <CurrentStep>{step}</CurrentStep>
      <TotalSteps>/2</TotalSteps>
    </div>
    <ActionText text='Cancel' onClick={onClick}/>
  </div>;
}

export default styled(CreationStep)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 17px;
`;
