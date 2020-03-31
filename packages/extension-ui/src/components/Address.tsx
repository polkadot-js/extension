// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension-base/background/types';
import { Chain } from '@polkadot/extension-chains/types';

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';
import settings from '@polkadot/ui-settings';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { AccountContext } from './contexts';
import Identicon from './Identicon';
import Svg from './Svg';

import Menu from './Menu';
import CopyImg from '../assets/copy.svg';
import DetailsImg from '../assets/details.svg';
import useOutsideClick from '../hooks/useOutsideClick';
import useMetadata from '../hooks/useMetadata';
import useToast from '../hooks/useToast';

interface Props {
  address?: string | null;
  className?: string;
  name?: React.ReactNode | null;
  children?: React.ReactNode;
  genesisHash?: string | null;
  actions?: React.ReactNode;
}

interface Recoded {
  account: AccountJson | null;
  formatted: string | null;
  prefix: number;
}

// find an account in our list
function findAccount (accounts: AccountJson[], publicKey: Uint8Array): AccountJson | null {
  const pkStr = publicKey.toString();

  return accounts.find(({ address }): boolean =>
    decodeAddress(address).toString() === pkStr
  ) || null;
}

// recodes an supplied address using the prefix/genesisHash, include the actual saved account & chain
function recodeAddress (address: string, accounts: AccountJson[], chain: Chain | null): Recoded {
  // decode and create a shortcut for the encoded address
  const publicKey = decodeAddress(address);

  // find our account using the actual publicKey, and then find the associated chain
  const account = findAccount(accounts, publicKey);
  const prefix = settings.prefix === -1 ? (chain?.ss58Format || 42) : settings.prefix;

  // always allow the actual settings to override the display
  return {
    account,
    formatted: encodeAddress(publicKey, prefix),
    prefix
  };
}

const ACCOUNTS_SCREEN_HEIGHT = 500;

function Address ({ address, className, children, genesisHash, name, actions }: Props): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const chain = useMetadata(genesisHash);
  const [{ account, formatted, prefix }, setRecoded] = useState<Recoded>({ account: null, formatted: null, prefix: 42 });
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [moveMenuUp, setIsMovedMenu] = useState(false);
  const actionsRef = useRef<HTMLDivElement>(null);
  const { show } = useToast();

  useOutsideClick(actionsRef, () => (showActionsMenu && setShowActionsMenu(!showActionsMenu)));

  useEffect((): void => {
    address && setRecoded(
      recodeAddress(address, accounts, chain)
    );
  }, [accounts, address, chain]);

  useEffect(() => {
    if (!showActionsMenu) {
      setIsMovedMenu(false);
    } else if (actionsRef.current) {
      const { bottom } = actionsRef.current.getBoundingClientRect();

      if (bottom > ACCOUNTS_SCREEN_HEIGHT) {
        setIsMovedMenu(true);
      }
    }
  }, [showActionsMenu]);

  const theme = ((chain && chain.icon) || 'polkadot') as 'polkadot';
  const _onClick = useCallback((): void => setShowActionsMenu(!showActionsMenu), [showActionsMenu]);
  const _onCopy = useCallback((): void => show('Copied'), [show]);

  return (
    <div className={className}>
      <div>
        <AccountInfoRow>
          <Identicon
            iconTheme={theme}
            prefix={prefix}
            value={formatted || address}
          />
          <Info>
            <Name>{name || (account && account.name) || '<unknown>'}</Name>
            <CopyAddress>
              <FullAddress>{formatted || '<unknown>'}</FullAddress>
              {chain?.genesisHash && (
                <Banner>{chain.name}</Banner>
              )}
              <CopyToClipboard text={(formatted && formatted) || ''} >
                <Svg src={CopyImg} onClick={_onCopy}/>
              </CopyToClipboard>
            </CopyAddress>
          </Info>
          {actions && (
            <>
              <Settings onClick={_onClick}>
                {showActionsMenu
                  ? <ActiveActionsIcon />
                  : <ActionsIcon />
                }
              </Settings>
              {showActionsMenu && (
                <MovableMenu
                  isMoved={moveMenuUp}
                  reference={actionsRef}
                >
                  {actions}
                </MovableMenu>
              )}
            </>
          )}
        </AccountInfoRow>
        {children}
      </div>
    </div>
  );
}

const CopyAddress = styled.div`
  display: flex;
  justify-content: space-between;

  & ${Svg} {
    width: 14px;
    height: 14px;
    margin-right: 10px;
    background: ${({ theme }): string => theme.accountDotsIconColor};
    &:hover {
      background: ${({ theme }): string => theme.labelColor};
      cursor: pointer;
    }
  }
`;

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
  width: 270px;
  overflow: hidden;
  text-overflow: ellipsis;
  color: ${({ theme }): string => theme.labelColor};
  font-size: 12px;
  line-height: 16px;
`;

FullAddress.displayName = 'FullAddress';

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
    content: '';
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

const Banner = styled.div`
  background: ${({ theme }): string => theme.primaryColor};
  border-radius: 0 0 8px 8px;
  color: white;
  font-size: 12px;
  line-height: 16px;
  padding: 0.1rem 0.5rem;
  position: absolute;
  right: 40px;
  top: 0;
`;

const MovableMenu = styled(Menu) <{ isMoved: boolean }>`
  ${({ isMoved }): string => isMoved ? 'bottom: 50px' : ''};
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
