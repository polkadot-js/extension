// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { Address, Button, ButtonArea } from '@polkadot/extension-ui/components';
import { Name, Password, DerivationPath } from '@polkadot/extension-ui/partials';
import { OnDerivationPathChangeProps } from '@polkadot/extension-ui/partials/DerivationPath';
import { KeypairType } from '@polkadot/util-crypto/types';
import styled from 'styled-components';

interface Props {
  onCreate: (name: string, password: string, suri: string, type?: KeypairType) => void | Promise<void | boolean>;
  seed: string;
}

export default function AccountCredentials ({ onCreate, seed }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [suri, setSuri] = useState<string | null>(null);
  const [pairType, setPairType] = useState<KeypairType | undefined>(undefined);

  function _onChange (suriResult: OnDerivationPathChangeProps): void {
    setSuri(suriResult.suri);
    if (suriResult.isValid) {
      setAddress(suriResult.address);
      setPairType(suriResult.keyPairType);
    } else {
      setAddress(null);
    }
  }

  return (
    <>
      <InputsArea>
        <Name
          isFocussed
          onChange={setName}
        />
        {name && <Password onChange={setPassword} />}
        {name && password && (
          <DerivationPath
            onChange={_onChange}
            seed={seed}
          />
        )}
      </InputsArea>
      {name && password && suri && (
        <>
          <VerticalButtonArea>
            <Address
              address={address}
              name={name}
            />
            <Button
              isDisabled={!address}
              onClick={(): void | Promise<void | boolean> => onCreate(name, password, suri, pairType)}
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
