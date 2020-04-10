// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { Address, BackButton, ButtonArea, NextStepButton, VerticalSpace } from '@polkadot/extension-ui/components';
import { Name, Password } from '@polkadot/extension-ui/partials';

interface Props {
  address: string;
  onBackClick: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
}

function AccountName ({ address, onBackClick, onCreate }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onCreate = useCallback(() => name && password && onCreate(name, password), [name, password, onCreate]);

  return (
    <>
      <Name
        isFocused
        onChange={setName}
      />
      {name && <Password onChange={setPassword} />}
      {name && password && (
        <Address
          address={address}
          name={name}
        />
      )}
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onBackClick} />
        <NextStepButton
          data-button-action='add new root'
          isDisabled={!password || !name}
          onClick={_onCreate}
        >
          Add the account with the generated seed
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default AccountName;
