// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';
import { ActionContext, ActionText, Header } from '@polkadot/extension-ui/components';

interface Props {
  step: number;
  text: string;
}

export default function HeaderWithSteps ({ step, text }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onCancel = useCallback(() => {
    onAction('/');
  }, [onAction]);

  return (
    <Header text={text}>
      <CreationSteps>
        <div>
          <CurrentStep>{step}</CurrentStep>
          <TotalSteps>/2</TotalSteps>
        </div>
        <ActionText
          onClick={_onCancel}
          text='Cancel'
        />
      </CreationSteps>
    </Header>
  );
}

const CreationSteps = styled.div`
  align-items: center;
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
  padding-right: 24px;
  margin-top: 3px;
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
