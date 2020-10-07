// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0
import { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useMemo } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, ActionBar, ActionText, Button, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { forgetAccount } from '../messaging';
import { Header } from '../partials';

type Props = RouteComponentProps<{ address: string }>;

function Forget ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const isExternal = useMemo(() => {
    let res: boolean | undefined;

    accounts.some((account) => {
      if (account.address === address) {
        res = account.isExternal;

        return true;
      }

      return false;
    });

    return res;
  }, [accounts, address]);

  const _goHome = useCallback(
    () => onAction('/'),
    [onAction]
  );

  const _onClick = useCallback(
    (): Promise<void> =>
      forgetAccount(address)
        .then(() => onAction('/'))
        .catch((error: Error) => console.error(error)),
    [address, onAction]
  );

  return (
    <>
      <Header
        showBackArrow
        text={t<string>('Forget account')}
      />
      <div>
        <Address
          address={address}
          isExternal={isExternal}
        >
          <MovedWarning isDanger>{t<string>('You are about to remove the account. This means that you will not be able to access it via this extension anymore. If you wish to recover it, you would need to use the seed.')}</MovedWarning>
          <ActionArea>
            <Button
              isDanger
              onClick={_onClick}
            >
              {t<string>('I want to forget this account')}
            </Button>
            <CancelButton>
              <ActionText
                onClick={_goHome}
                text={t<string>('Cancel')}
              />
            </CancelButton>
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
  padding: 10px 24px;
`;

const CancelButton = styled(ActionBar)`
  margin-top: 4px;

  ${ActionText} {
    margin: auto;
  }
`;

export default withRouter(Forget);
