// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountWithChildren } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';

import getNetworkMap from '@polkadot/extension-ui/util/getNetworkMap';

import { AccountContext } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';
import { Header } from '../../partials/index.js';
import { styled } from '../../styled.js';
import AccountsTree from './AccountsTree.js';
import AddAccount from './AddAccount.js';

interface Props {
  className?: string;
}

function Accounts ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [filter, setFilter] = useState('');
  const [filteredAccount, setFilteredAccount] = useState<AccountWithChildren[]>([]);
  const { hierarchy } = useContext(AccountContext);
  const networkMap = useMemo(() => getNetworkMap(), []);

  useEffect(() => {
    setFilteredAccount(
      filter
        ? hierarchy.filter((account) =>
          account.name?.toLowerCase().includes(filter) ||
          (account.genesisHash && networkMap.get(account.genesisHash)?.toLowerCase().includes(filter)) ||
          account.address.toLowerCase().includes(filter)
        )
        : hierarchy
    );
  }, [filter, hierarchy, networkMap]);

  const _onFilter = useCallback((filter: string) => {
    setFilter(filter.toLowerCase());
  }, []);

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              onFilter={_onFilter}
              showAdd
              showConnectedAccounts
              showSearch
              showSettings
              text={t('Accounts')}
            />
            <div className={className}>
              {filteredAccount.map((json, index): React.ReactNode => (
                <AccountsTree
                  {...json}
                  key={`${index}:${json.address}`}
                />
              ))}
            </div>
          </>
        )
      }
    </>
  );
}

export default styled(Accounts)<Props>`
  height: calc(100vh - 2px);
  overflow-y: scroll;
  margin-top: -25px;
  padding-top: 25px;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
