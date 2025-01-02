// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountContext, ActionContext, Button } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { approveAuthRequest, cancelAuthRequest, rejectAuthRequest } from '../../messaging.js';
import { AccountSelection } from '../../partials/index.js';
import { styled } from '../../styled.js';
import NoAccount from './NoAccount.js';

interface Props {
  authId: string;
  className?: string;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { accounts, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    const defaultAccountSelection = accounts
      .filter(({ isDefaultAuthSelected }) => !!isDefaultAuthSelected)
      .map(({ address }) => address);

    setSelectedAccounts && setSelectedAccounts(defaultAccountSelection);
  }, [accounts, setSelectedAccounts]);

  const _onApprove = useCallback(
    (): void => {
      approveAuthRequest(authId, selectedAccounts)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    },
    [authId, onAction, selectedAccounts]
  );

  const _onReject = useCallback(
    (): void => {
      const rejectFunction = dontAskAgain ? rejectAuthRequest : cancelAuthRequest;

      rejectFunction(authId)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    },
    [authId, onAction, dontAskAgain]
  );

  const _onToggleDontAskAgain = useCallback(
    (): void => {
      setDontAskAgain((prev) => !prev);
    },
    []
  );

  if (!accounts.length) {
    return <NoAccount authId={authId} />;
  }

  return (
    <div className={className}>
      <AccountSelection
        origin={origin}
        url={url}
      />
      <div className='footer'>
        <div className='buttonContainer'>
          <Button
            className='acceptButton'
            onClick={_onApprove}
          >
            {t('Connect {{total}} account(s)', { replace: {
              total: selectedAccounts.length
            } })}
          </Button>
          <Button
            className='rejectButton'
            isDanger
            onClick={_onReject}
          >
            {t('Reject')}
          </Button>
        </div>
        <div className='dontAskAgainContainer'>
          <input
            checked={dontAskAgain}
            onChange={_onToggleDontAskAgain}
            type='checkbox'
          />
          <label>{t("Don't ask again")}</label>
        </div>
      </div>
    </div>

  );
}

export default styled(Request)<Props>`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow-y: auto;

  .footer {
    padding: 1rem 1rem 0rem 1rem;
    background: var(--background);
  }

  .buttonContainer {
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-bottom: 0.5rem;
  }

  .acceptButton, .rejectButton {
    width: 48%;
    height: 40px;
  }

  .dontAskAgainContainer {
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;

    input {
      margin-right: 0.5rem;
    }
  }
`;
