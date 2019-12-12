// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import React, { useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';
import findChain from '@polkadot/extension-chains';
import settings from '@polkadot/ui-settings';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext } from './contexts';
import Identicon from '@polkadot/extension-ui/components/Identicon';
import Svg from '@polkadot/extension-ui/components/Svg';
import Menu from '@polkadot/extension-ui/components/Menu';
import DetailsImg from '../assets/details.svg';
import { useOutsideClick } from '@polkadot/extension-ui/hooks';

interface Props {
  address?: string | null;
  className?: string;
  name?: React.ReactNode | null;
  children?: React.ReactNode;
  genesisHash?: string | null;
  actions?: React.ReactNode;
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
    encodeAddress(publicKey, settings.prefix === -1 ? chain.ss58Format : settings.prefix),
    account,
    chain
  ];
}

function Address ({ address, className, children, genesisHash, name, actions }: Props): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const [account, setAccount] = useState<AccountJson | null>(null);
  const [chain, setChain] = useState<Chain | null>(null);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const actionsRef = useRef(null);
  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  useEffect((): void => {
    if (!address) {
      return;
    }
    const [formatted, account, chain] = recodeAddress(address, accounts, genesisHash);

    setFormatted(formatted);
    setChain(chain);
    setAccount(account);
  }, [address]);

  const theme = ((chain && chain.icon) || 'polkadot') as 'polkadot';

  return (
    <div className={className}>
      <div>
        <AccountInfoRow>
          <Identicon
            iconTheme={theme}
            value={address}
          />
          <Info>
            <Name>{name || (account && account.name) || '<unknown>'}</Name>
            <FullAddress>{formatted || '<unknown>'}</FullAddress>
          </Info>
          {actions && (
            <>
              <Settings onClick={(): void => setShowActionsMenu(!showActionsMenu)}>
                {showActionsMenu ? <ActiveActionsIcon /> : <ActionsIcon />}
              </Settings>
              {showActionsMenu && <Menu reference={actionsRef}>{actions}</Menu>}
            </>
          )}
        </AccountInfoRow>
        {children}
      </div>
    </div>
  );
}

const AccountInfoRow = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  height: 72px;
  border-radius: 4px;
`;

const Info = styled.div`
  width: 100%;
`;

const Name = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  width: 300px;
  margin: 2px 0;
  font-weight: 600;
  font-size: 16px;
  line-height: 22px;
`;

const FullAddress = styled.div`
  width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }): string => theme.labelColor};
  font-size: 12px;
  line-height: 16px;
`;

const Settings = styled.div`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 40px;

  & ${Svg} {
    width: 3px;
    height: 19px;
  }

  &:before {
    content: "";
    position: absolute;
    left: 0;
    top: 25%;
    bottom: 25%;
    width: 1px;
    background: ${({ theme }): string => theme.boxBorderColor};
  }

  &:hover {
    cursor: pointer;
    background: ${({ theme }): string => theme.readonlyInputBackground};
  }
`;

Settings.displayName = 'Details';

const ActionsIcon = styled(Svg).attrs(() => ({
  src: DetailsImg
}))`
  background: ${({ theme }): string => theme.accountDotsIconColor};
`;

const ActiveActionsIcon = styled(Svg).attrs(() => ({
  src: DetailsImg
}))`
  background: ${({ theme }): string => theme.primaryColor};
`;

export default styled(Address)`
  position: relative;
  margin-bottom: 8px;

  & > div {
    background: ${({ theme }): string => theme.accountBackground};
    border: 1px solid ${({ theme }): string => theme.boxBorderColor};
    box-sizing: border-box;
    border-radius: 4px;
  }

  & ${Identicon} {
    margin-left: 25px;
    margin-right: 10px;

    & svg {
      width: 50px;
      height: 50px;
    }
  }
`;
