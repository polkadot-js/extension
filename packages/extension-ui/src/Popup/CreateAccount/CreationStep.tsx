// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';
import { ActionText, Title } from '@polkadot/extension-ui/components';

interface Props {
  step: number;
  onClick: () => void;
  className?: string;
}

function CreationStep ({ className, onClick, step }: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div>
        <CreateAnAccount />
        <CurrentStep>{step}</CurrentStep>
        <TotalSteps>/2</TotalSteps>
      </div>
      <ActionText
        onClick={onClick}
        text={step === 1 ? 'Cancel' : 'Back'}
      />
    </div>
  );
}

const CreateAnAccount = styled(Title).attrs(() => ({
  children: 'Create an account:'
}))`
  display: inline;
  margin-right: 10px;
`;

const CurrentStep = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.primaryColor};
  font-weight: 600;
`;

const TotalSteps = styled.span`
  font-size: ${({ theme }): string => theme.labelFontSize};
  line-height: ${({ theme }): string => theme.labelLineHeight};
  color: ${({ theme }): string => theme.textColor};
  font-weight: 600;
`;

export default styled(CreationStep)`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-bottom: 17px;
`;
