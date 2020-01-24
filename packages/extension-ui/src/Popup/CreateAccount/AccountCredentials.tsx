// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect, useRef } from 'react';
import { Address, Button, ButtonArea } from '@polkadot/extension-ui/components';
import { Name, Password } from '@polkadot/extension-ui/partials';
import DerivationPath from '@polkadot/extension-ui/Popup/CreateAccount/DerivationPath';
import { KeypairType } from '@polkadot/util-crypto/types';
import styled from 'styled-components';
import { validateSeed } from '@polkadot/extension-ui/messaging';

interface Props {
  onCreate: (name: string, password: string, suri: string, type?: KeypairType) => void | Promise<void | boolean>;
  seed: string;
}

export default function AccountCredentials ({ onCreate, seed }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [address, setAddress] = useState('');
  const [isValid, setIsValid] = useState(true);
  const [derivation, setDerivation] = useState<{
    pairType?: KeypairType;
    path?: string;
  }>({});

  const getSuri = (): string => (derivation.path ? `${seed}${derivation.path}` : seed);

  const ref = useRef<HTMLDivElement>(null);

  const scrollToBottom = (reverse: boolean): void => {
    ref.current && ref.current.scrollTo && ref.current.scrollTo({
      top: reverse ? -100000000 : 100000000, // a sufficiently large number
      behavior: 'smooth'
    });
  };

  useEffect(() => {
    setAddress('');
    const suri = getSuri();
    (async (): Promise<void> => {
      try {
        const { address } = await validateSeed(suri, derivation.pairType);
        setAddress(address);
        setIsValid(true);
      } catch (error) {
        setIsValid(false);
      }
    })();
  }, [derivation]);

  return (
    <>
      <InputsArea ref={ref}>
        <Name
          isFocussed
          onChange={setName}
        />
        {name && <Password onChange={setPassword} />}
        {name && password && (
          <DerivationPath
            onChange={setDerivation}
            onExpand={scrollToBottom}
            isValid={isValid}
          />
        )}
      </InputsArea>
      {name && password && (
        <>
          <VerticalButtonArea>
            <Address
              address={address}
              name={name}
            />
            <Button
              isDisabled={!isValid}
              onClick={(): void | Promise<void | boolean> => onCreate(name, password, getSuri(), derivation.pairType)}
            >
              Add the account with the generated seed
            </Button>
          </VerticalButtonArea>
        </>
      )}
    </>
  );
}

const VerticalButtonArea = styled(ButtonArea)`
  flex-direction: column;
`;

const InputsArea = styled.div`
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;
