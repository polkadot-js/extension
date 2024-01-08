// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
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
  const { selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => {
        if (!list[url]) {
          return;
        }

        setSelectedAccounts && setSelectedAccounts(list[url].authorizedAccounts);
      })
      .catch(console.error);
  }, [setSelectedAccounts, url]);

  const _onApprove = useCallback(
    (): void => {
      updateAuthorization(selectedAccounts, url)
        .then(() => onAction('../index.js'))
        .catch(console.error);
    },
    [onAction, selectedAccounts, url]
  );

  return (
    <>
      <Header
        showBackArrow
        smallMargin={true}
        text={t('Accounts connected to {{url}}', { replace: { url } })}
      />
      <div className={className}>
        <AccountSelection
          className='accountSelection'
          origin={origin}
          showHidden={true}
          url={url}
          withWarning={false}
        />
        <Button
          className='acceptButton'
          onClick={_onApprove}
        >
          {t('Connect {{total}} account(s)', { replace: {
            total: selectedAccounts.length
          } })}
        </Button>
      </div>
    </>
  );
}

export default styled(AccountManagement)<Props>`
  .accountSelection{
    .accountList{
      height: 390px;
    }
  }
  .acceptButton {
    width: 90%;
    margin: 0.5rem auto 0;
  }
`;
