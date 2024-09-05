// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect } from 'react';

import { AccountContext, ActionBar, ActionContext, Button, Link } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging.js';
import { AccountSelection } from '../../partials/index.js';
import { styled } from '../../styled.js';
import NoAccount from './NoAccount.js';

interface Props {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, isFirst, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { accounts, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

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

  const _onClose = useCallback(
    (): void => {
      rejectAuthRequest(authId)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    },
    [authId, onAction]
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
      {isFirst && (
        <Button
          className='acceptButton'
          onClick={_onApprove}
        >
          {t('Connect {{total}} account(s)', { replace: {
            total: selectedAccounts.length
          } })}
        </Button>
      )}
      <ActionBar className='rejectionButton'>
        <Link
          className='closeLink'
          isDanger
          onClick={_onClose}
        >
          {t('Reject')}
        </Link>
      </ActionBar>
    </div>
  );
}

export default styled(Request)<Props>`
  .acceptButton {
    width: 90%;
    margin: .5rem auto 0;
  }

  .rejectionButton {
    margin: 0 0 15px 0;
    text-decoration: underline;

    .closeLink {
      margin: auto;
      padding: 0;
    }
  }
`;
