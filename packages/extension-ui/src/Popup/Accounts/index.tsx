// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useContext, useEffect } from 'react';
import styled from 'styled-components';

import { AccountsStore } from '@polkadot/extension-base/stores';
import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { AccountContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import AccountsTree from './AccountsTree';
import AddAccount from './AddAccount';

interface Props extends ThemeProps {
  className?: string;
}

function Accounts({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { hierarchy } = useContext(AccountContext);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    cryptoWaitReady().then(() => {
      keyring.loadAll({ store: new AccountsStore() });
    });

    // getCrowdLoands();
  }, []);

  // function getCrowdLoands() {
  //   const crowdloanWorker: Worker = new Worker(new URL('../../util/newUtils/workers/getCrowdloans.js', import.meta.url));

  //   const chain='dummy';// TODO: change it

  //   crowdloanWorker.postMessage({ chain });

  //   crowdloanWorker.onerror = (err) => {
  //     console.log(err);
  //   };

  //   crowdloanWorker.onmessage = (e: MessageEvent<any>) => {
  //     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  //     const result: { crowdloans: Auction } = e.data;

  //     console.log('crowd loans ', result);
  //   };
  // }

  console.log('hierarchy:', hierarchy);

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
                  key={`${index}:${json.address} `}
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
  }`;
