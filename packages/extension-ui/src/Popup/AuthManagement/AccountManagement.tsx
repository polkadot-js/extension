// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, updateAuthorization } from '../../messaging';
import { AccountSelection, Header } from '../../partials';

interface Props extends ThemeProps {
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
      .catch((e) => console.error(e));
  }, [setSelectedAccounts, url]);

  const _onApprove = useCallback(
    (): void => {
      updateAuthorization(selectedAccounts, url)
        .then(() => onAction('/auth-list'))
        .catch((error: Error) => console.error(error));
    },
    [onAction, selectedAccounts, url]
  );

  return (
    <>
      <Header
        showBackArrow
        smallMargin={true}
        text={t<string>('Accounts connected to {{url}}', { replace: { url } })}
      />
      <div className={className}>
        <AccountSelection
          origin={origin}
          url={url}
          withWarning={false}
        />
        <Button
          className='acceptButton'
          onClick={_onApprove}
        >
          {t<string>('Connect {{total}} account(s)', { replace: {
            total: selectedAccounts.length
          } })}
        </Button>
      </div>
    </>
  );
}

export default styled(AccountManagement)`
  .acceptButton {
    width: 90%;
    margin: 25px auto 0;
  }

  .rejectionButton {
    margin: 8px 0 15px 0;
    text-decoration: underline;

    .rejectionLink {
      margin: auto;
    }
  }
`;
