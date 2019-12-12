// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import { ActionContext, Address, Button, Warning, Title } from '../components';

import { forgetAccount } from '../messaging';
import { Back } from '../partials';
import styled from 'styled-components';

type Props = RouteComponentProps<{ address: string }>;

function Forget ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const _onClick = (): Promise<void> =>
    forgetAccount(address)
      .then((): void => onAction('/'))
      .catch((error: Error) => console.error(error));

  return (
    <>
      <Back />
      <Title>Forget account</Title>
      <div>
        <Address address={address}>
          <MovedWarning danger>
            You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.
          </MovedWarning>
          <ActionArea>
            <Button
              isDanger
              onClick={_onClick}
            >
              I want to forget this account
            </Button>
          </ActionArea>
        </Address>
      </div>
    </>
  );
}

const MovedWarning = styled(Warning)`
  margin-top: 8px;
`;

const ActionArea = styled.div`
  padding: 25px 24px;
`;

export default withRouter(Forget);
