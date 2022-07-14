// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Trans } from 'react-i18next';
import styled from 'styled-components';

import { AccountContext, Checkbox, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import AccountsTree from '../Popup/Accounts/AccountsTree';

interface Props extends ThemeProps {
  className?: string;
  url: string;
  origin: string;
  showHidden?: boolean;
  withWarning?: boolean;
}

function AccounSelection ({ className, origin, showHidden = false, url, withWarning = true }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts, hierarchy, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const [isIndeterminate, setIsIndeterminate] = useState(false);
  const allVisibleAccounts = useMemo(() => accounts.filter(({ isHidden }) => !isHidden), [accounts]);
  const noAccountSelected = useMemo(() => selectedAccounts.length === 0, [selectedAccounts.length]);
  const allDisplayedAddresses = useMemo(
    () => showHidden
      ? accounts.map(({ address }) => address)
      : allVisibleAccounts.map(({ address }) => address)
    , [accounts, allVisibleAccounts, showHidden]
  );
  const areAllAccountsSelected = useMemo(
    () => selectedAccounts.length === allDisplayedAddresses.length
    , [allDisplayedAddresses.length, selectedAccounts.length]
  );

  useEffect(() => {
    const nextIndeterminateState = !noAccountSelected && !areAllAccountsSelected;

    setIsIndeterminate(nextIndeterminateState);
  }, [areAllAccountsSelected, noAccountSelected]);

  const _onSelectAllToggle = useCallback(() => {
    if (areAllAccountsSelected) {
      setSelectedAccounts && setSelectedAccounts([]);

      return;
    }

    setSelectedAccounts && setSelectedAccounts(allDisplayedAddresses);
  }, [allDisplayedAddresses, areAllAccountsSelected, setSelectedAccounts]
  );

  return (
    <div className={className}>
      {withWarning && (
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
            .map((json, index): React.ReactNode => (
              <AccountsTree
                {...json}
                key={`${index}:${json.address}`}
                showHidden={showHidden}
                withCheckbox={true}
                withMenu={false}
              />
            ))}
      </div>
    </div>
  );
}

export default styled(AccounSelection)(({ theme }: Props) => `
  .accountList {
    overflow-y: auto;
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

  .warningMargin {
    margin: 0 24px 0 1.45rem;

    .warning-message {
      display: block;
      width: 100%
    }
  }
`);
