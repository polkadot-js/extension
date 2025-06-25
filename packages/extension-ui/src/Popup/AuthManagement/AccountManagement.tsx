// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect } from 'react';
import { useParams } from 'react-router';

import { AccountContext, ActionContext, Button } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { getAuthList, updateAuthorization } from '../../messaging.js';
import { AccountSelection, Header } from '../../partials/index.js';
import { styled } from '../../styled.js';

interface Props {
  className?: string;
}

function AccountManagement ({ className }: Props): React.ReactElement<Props> {
  const { url } = useParams<{url: string}>();
  const decodedUrl = decodeURIComponent(url);
  const { selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);


  useEffect(() => {
    getAuthList()
      .then(({ list }) => {
        if (!list[decodedUrl]) {
          return;
        }

        setSelectedAccounts && setSelectedAccounts(list[decodedUrl].authorizedAccounts);
      })
      .catch(console.error);
  }, [setSelectedAccounts, decodedUrl]);

  const _onApprove = useCallback(
    (): void => {
      updateAuthorization(selectedAccounts, decodedUrl)
        .then(() => onAction('../index.js'))
        .catch(console.error);
    },
    [onAction, selectedAccounts, decodedUrl]
  );

  return (
    <div className={`${className}`}>
      <Header
        showBackArrow
        smallMargin={true}
        text={t('Accounts connected to {{url}}', { replace: { url: decodedUrl } })}
      />
      <div className='content'>
        <AccountSelection
          origin={decodedUrl}
          showHidden={true}
          url={decodedUrl}
          withWarning={false}
        />
        <div className='footer'>
          <Button
            className='acceptButton'
            onClick={_onApprove}
          >
            {t('Connect {{total}} account(s)', { replace: {
              total: selectedAccounts.length
            } })}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default styled(AccountManagement)<Props>`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 550px;

  .content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: auto;
  }

  .footer {
    background: var(--background);
    flex-shrink: 0;
  }

  .acceptButton {
    width: 90%;
    margin: 0.5rem auto;
  }
`;
