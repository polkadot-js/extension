// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { AccountContext, ActionContext } from '../../components/index.js';
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
  const approveButtonRef = useRef<HTMLButtonElement>(null);
  const rejectButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const defaultAccountSelection = accounts
      .filter(({ isDefaultAuthSelected }) => !!isDefaultAuthSelected)
      .map(({ address }) => address);

    setSelectedAccounts && setSelectedAccounts(defaultAccountSelection);
  }, [accounts, setSelectedAccounts]);

  // Direct DOM event handlers to provide support for Brave
  useEffect(() => {
    const handleApprove = () => {
      if (selectedAccounts.length === 0) return;

      approveAuthRequest(authId, selectedAccounts)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    };

    const handleReject = () => {
      const rejectFunction = dontAskAgain ? rejectAuthRequest : cancelAuthRequest;

      rejectFunction(authId)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    };

    // Add direct event listeners to the button elements
    const approveBtn = approveButtonRef.current;
    const rejectBtn = rejectButtonRef.current;

    if (approveBtn) {
      approveBtn.addEventListener('click', handleApprove);
    }

    if (rejectBtn) {
      rejectBtn.addEventListener('click', handleReject);
    }

    // Clean up event listeners
    return () => {
      if (approveBtn) {
        approveBtn.removeEventListener('click', handleApprove);
      }

      if (rejectBtn) {
        rejectBtn.removeEventListener('click', handleReject);
      }
    };
  }, [authId, onAction, selectedAccounts, dontAskAgain]);

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
          <button
            className='acceptButton'
            disabled={selectedAccounts.length === 0}
            ref={approveButtonRef}
          >
            {t('Connect {{total}} account(s)', { replace: {
              total: selectedAccounts.length
            } })}
          </button>
          <button
            className='rejectButton'
            ref={rejectButtonRef}
          >
            {t('Reject')}
          </button>
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

// eslint-disable-next-line no-unsafe-call
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
    border: none;
    border-radius: var(--borderRadius);
    cursor: pointer;
    font-size: 15px;
    line-height: 20px;
  }

  .acceptButton {
    background: var(--buttonBackground);
    color: var(--buttonTextColor);
  }

  .acceptButton:hover:not(:disabled) {
    background: var(--buttonBackgroundHover);
  }

  .acceptButton:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .rejectButton {
    background: var(--buttonBackgroundDanger);
    color: var(--buttonTextColor);
  }

  .rejectButton:hover {
    background: var(--buttonBackgroundDangerHover);
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
