// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { AccountWithChildren } from '@polkadot/extension-base/background/types';
import { AccountsStore } from '@polkadot/extension-base/stores';
import { Chain } from '@polkadot/extension-chains/types';
import getNetworkInfo from '@polkadot/extension-ui/util/HackathonUtilFiles/getNetwork';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountContext, SettingsContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { getMetadata, updateBalance } from '../../messaging';
import { Header } from '../../partials';
import { accountsBalanceType, getFormattedAddress, handleAccountBalance } from '../../util/HackathonUtilFiles/hackatonUtils';
import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';

interface Props extends ThemeProps {
  className?: string;
}

async function getChainData(genesisHash?: string | null): Promise<Chain | null> {
  if (genesisHash) {
    const chain = await getMetadata(genesisHash, true);

    if (chain) return chain;
  }

  return null;
}

function Accounts({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);
  const settings = useContext(SettingsContext);
  const [balances, setBalances] = useState<accountsBalanceType[]>([]);
  // const [subscription, setSubscription] = useState<boolean>(true);

  async function getBalancesFromMetaData() {
    const lastBalances: accountsBalanceType[] = [];

    for (let i = 0; i < hierarchy.length; i++) {
      const acc = hierarchy[i];
      const accLastBalance = acc.lastBalance ? acc.lastBalance.split('_') : null;
      const accBalance = {
        address: acc.address,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        balanceInfo: accLastBalance ? JSON.parse(accLastBalance[1]) : null,
        chain: acc.genesisHash ? await getChainData(acc.genesisHash) : null,
        name: acc.name ? acc.name : ''
      };

      lastBalances[i] = accBalance;
    }

    if (!lastBalances.length) {
      updateBalanceIfChainChanged();
    }

    setBalances(lastBalances);
  }

  function updateBalanceIfChainChanged() {
    const temp = balances;

    hierarchy.forEach((h) => {
      const index = balances.findIndex((b) => b.address === h.address);

      if (index >= 0) {
        const genesisHashInBalance = balances[index].chain ? balances[index].chain?.genesisHash : null;
        const genesisHashInHirerarchy = h.genesisHash ? h.genesisHash : null;

        if (!h.lastBalance || genesisHashInBalance !== genesisHashInHirerarchy) {
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          subscribeToBalanceChange(h);

          // remove that item from balances array
          temp.splice(index, 1);
          setBalances([...temp]);
        }
      }
    });
  }

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    getBalancesFromMetaData();
  }, []);

  useEffect(() => {
    if (!balances.length) {
      return;
    }

    updateBalanceIfChainChanged();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hierarchy]);

  useEffect(() => {
    if (!balances.length) return;

    // save balances to metadata on every balances change
    balances.forEach((bal) => {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      updateBalance(
        String(bal.address),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        JSON.stringify(bal.balanceInfo, (_key, value) => typeof value === 'bigint' ? value.toString() : value),
        bal.chain ? bal.chain.name : 'Westend');
    });
  }, [balances]);

  async function subscribeToBalanceChange(_acc: AccountWithChildren) {
    const chain = _acc.genesisHash ? await getChainData(_acc.genesisHash) : null;
    const { coin, decimals, url } = getNetworkInfo(chain);
    const formattedAddress = getFormattedAddress(_acc.address, chain, settings);
    const wsProvider = new WsProvider(url);
    const api = await ApiPromise.create({ provider: wsProvider });

    await api.query.system.account(formattedAddress, ({ data: balance }) => {
      if (balance) {
        const result = {
          coin: coin,
          decimals: decimals,
          ...handleAccountBalance(balance)
        };
        const temp = balances;

        const index = temp.findIndex((b) => b.address === _acc.address);

        if (index >= 0) {
          temp[index].balanceInfo = result;
          temp[index].chain = chain;
          temp[index].name = _acc.name || '';
        } else {
          temp.push({
            address: _acc.address,
            balanceInfo: result,
            chain: chain,
            name: _acc.name || ''
          });
        }

        setBalances([...temp]);
      }
    });
  }

  return (
    <>
      {(hierarchy.length === 0)
        ? <AddAccount />
        : (
          <>
            <Header
              showAdd
              showSettings
              text={t<string>('Accounts')}
            />
            <div className={className}>
              {hierarchy.map((json, index): React.ReactNode => (
                <AccountsTree
                  {...json}
                  balances={balances}
                  key={`${index}:${json.address} `}
                  setBalances={setBalances}
                />
              ))}
            </div>
          </>
        )
      }
    </>
  );
}

export default styled(Accounts)`
  height: calc(100vh - 2px);
  overflow - y: scroll;
  margin - top: -25px;
  padding - top: 25px;
  scrollbar - width: none;

  &:: -webkit - scrollbar {
    display: none;
  }
  `;
