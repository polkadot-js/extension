// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { AccountContext, ActionBar, ActionContext, Button, Checkbox, Link, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';
import AccountsTree from '../Accounts/AccountsTree';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, isFirst, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { accounts, hierarchy } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const allVisibleAccounts = useMemo(() => accounts.filter(({ isHidden }) => !isHidden), [accounts]);
  const areAllAccountsSelected = useMemo(() => selectedAccounts.length === allVisibleAccounts.length, [allVisibleAccounts.length, selectedAccounts.length]);
  const noAccountSelected = useMemo(() => selectedAccounts.length === 0, [selectedAccounts.length]);

  useEffect(() => {
    const nextIndeterminateState = !noAccountSelected && !areAllAccountsSelected;

    setIsIndeterminate(nextIndeterminateState);
  }, [areAllAccountsSelected, noAccountSelected]);

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
      rejectAuthRequest(authId)
        .then(() => onAction())
        .catch((error: Error) => console.error(error));
    },
    [authId, onAction]
  );

  const _onSelectAllToggle = useCallback(() => {
    if (areAllAccountsSelected) {
      setSelectedAccounts && setSelectedAccounts([]);

      return;
    }

    const allVisibleAddresses = allVisibleAccounts
      .map(({ address }) => address);

    setSelectedAccounts && setSelectedAccounts(allVisibleAddresses);
  }, [allVisibleAccounts, areAllAccountsSelected, setSelectedAccounts]
  );

  return (
    <div className={className}>
      {isFirst && (
        <Warning className='warningMargin'>
          <Trans key='accessRequest'>An application, self-identifying as <span className='tab-name'>{origin}</span> is requesting access from{' '}
            <a
              href={url}
              rel='noopener noreferrer'
              target='_blank'
            >
              <span className='tab-url'>{url}</span>
            </a>
          </Trans>
        </Warning>
      )}
      <Checkbox
        checked={areAllAccountsSelected}
        className='accountTree-checkbox'
        indeterminate={isIndeterminate}
        label={t('Select all')}
        onChange={_onSelectAllToggle}
      />
      <div className='accountList'>
        {
          hierarchy
            .filter(({ isHidden }) => !isHidden)
            .map((json, index): React.ReactNode => (
              <AccountsTree
                {...json}
                key={`${index}:${json.address}`}
                withCheckbox={true}
                withMenu={false}
              />
            ))}
      </div>
      {isFirst && (
        <Button
          className='acceptButton'
          onClick={_onApprove}
        >
          {t<string>('Connect selected accounts')}
        </Button>
      )}
      <ActionBar className='rejectionButton'>
        <Link
          className='rejectionLink'
          isDanger
          onClick={_onReject}
        >
            Reject
        </Link>
      </ActionBar>
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `
  .accountList {
    overflow-y: auto;
    margin-top: 5px;
    height: 270px;
  }

  .tab-name,
  .tab-url {
    color: ${theme.textColor};
    display: inline-block;
    max-height: 10rem;
    width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
    cursor: pointer;
    text-decoration: underline;
    white-space: nowrap;
  }


  .acceptButton {
    width: 90%;
    margin: 25px auto 0;
  }

  .warningMargin {
    margin: -19px 24px 0 1.45rem;

    .warning-message {
      display: block;
      width: 100%
    }
  }

  .rejectionButton {
    margin: 8px 0 15px 0;
    text-decoration: underline;

    .rejectionLink {
      margin: auto;
    }
  }
`);
