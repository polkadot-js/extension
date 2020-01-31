// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';

import {
  ActionContext,
  Address,
  Button,
  ButtonArea,
  Header,
  TextAreaWithLabel
} from '../components';
import { createAccountSuri, validateSeed } from '../messaging';
import { Name, Password, DerivationPath } from '../partials';
import styled from 'styled-components';
import { OnDerivationPathChangeProps } from '@polkadot/extension-ui/partials/DerivationPath';
import { KeypairType } from '@polkadot/util-crypto/types';

type Props = {};

export default function Import (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [seed, setSeed] = useState<string | null>(null);
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

  const _onChangeSeed = async (seed: string): Promise<void> => {
    try {
      await validateSeed(seed);
      setSeed(seed);
    } catch (e) {
      setSeed(null);
    }
  };

  const _onCreate = (): void => {
    if (name && password && suri) {
      createAccountSuri(name, password, suri, pairType)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <>
      <HeaderWithSmallerMargin text='Import account' showBackArrow />
      <InputsArea>
        <>
          <SeedInput
            rowsCount={2}
            isError={!seed}
            isFocused
            label='existing 12 or 24-word mnemonic seed'
            onChange={_onChangeSeed}
          />
          {seed && <Name onChange={setName} />}
          {seed && name && <Password onChange={setPassword} />}
          {seed && name && password && <DerivationPath
            onChange={_onChange}
            seed={seed}
          />}
        </>
      </InputsArea>
      {seed && name && password && suri && (
        <VerticalButtonArea>
          <Address
            address={address}
            name={name}
          />
          <Button onClick={_onCreate}>Add the account with the supplied seed</Button>
        </VerticalButtonArea>
      )}
    </>
  );
}

const InputsArea = styled.div`
  height: 100%;
  overflow-y: scroll;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;

const SeedInput = styled(TextAreaWithLabel)`
  margin-bottom: 16px;

  textarea {
    height: unset;
  }
`;

const VerticalButtonArea = styled(ButtonArea)`
  flex-direction: column;
`;
