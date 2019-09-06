// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension/background/types';
import { Chain } from '@polkadot/extension-chains/types';
import { Prefix } from '@polkadot/util-crypto/address/types';

import React, { useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension-chains';
import Identicon from '@polkadot/react-identicon';
import settings from '@polkadot/ui-settings';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import IconBox from './IconBox';
import { AccountContext } from './contexts';

interface Props {
  address?: string | null;
  children?: React.ReactNode;
  className?: string;
  name?: React.ReactNode | null;
  genesisHash?: string | null;
  theme?: 'polkadot' | 'substrate';
}

// find an account in our list
function findAccount (accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

// recodes an supplied address using the prefix/genesisHash, include the actual saved account & chain
function recodeAddress (address: string, accounts: AccountJson[], genesisHash?: string | null): [string, AccountJson | null, Chain] {
  // decode and create a shortcut for the encoded address
  const publicKey = decodeAddress(address);

  // find our account using the actual publicKey, and then find the associated chain
  const account = findAccount(accounts, publicKey);
  const chain = findChain((account && account.genesisHash) || genesisHash);

  return [
    // always allow the actual settings to override the display
    encodeAddress(publicKey, (settings.prefix === -1 ? chain.ss58Format : settings.prefix) as Prefix),
    account,
    chain
  ];
}

function Address ({ address, children, className, genesisHash, name, theme = 'polkadot' }: Props): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const [account, setAccount] = useState<AccountJson | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect((): void => {
    if (!address) {
      return;
    }

    const [formatted, account, chain] = recodeAddress(address, accounts, genesisHash);

    setFormatted(formatted);
    setChain(chain);
    setAccount(account);
  }, [address]);

  return (
    <IconBox
      banner={chain && chain.genesisHash && chain.name}
      className={className}
      icon={
        <Identicon
          className='icon'
          size={64}
          theme={theme}
          value={address}
        />
      }
      intro={
        <>
          <div className='name'>{name || (account && account.name) || '<unknown>'}</div>
          <div className='address'>{formatted || '<unknown>'}</div>
        </>
      }
    >
      {children}
    </IconBox>
  );
}

export default styled(Address)`
  .address {
    opacity: 0.5;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .name {
    padding-bottom: 0.5rem;
  }
`;
