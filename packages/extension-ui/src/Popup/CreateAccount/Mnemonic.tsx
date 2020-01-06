// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { Button, ButtonArea, Checkbox, MnemonicSeed, VerticalSpace, Warning } from '../../components';

interface Props {
  seed: string;
  onNextStep: () => void;
}

const onCopy = (): void => {
  const mnemonicSeedTextElement = document.querySelector('textarea');
  if (!mnemonicSeedTextElement) {
    return;
  }
  mnemonicSeedTextElement.select();
  document.execCommand('copy');
};

function Mnemonic ({ seed, onNextStep }: Props): React.ReactElement<Props> {
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false);
  return (
    <>
      <Warning>
      Please write down your wallet’s mnemonic seed and keep it in a safe place. <br />
      Mnemonic seed is used to restore your wallet. Keep it carefully in case you lose your assets.
      </Warning>
      <MnemonicSeed
        seed={seed}
        onCopy={onCopy}
      />
      <VerticalSpace />
      <Checkbox
        checked={isMnemonicSaved}
        onChange={setIsMnemonicSaved}
        label='I have saved my mnemonic seed safely.'
      />
      <ButtonArea>
        <Button isDisabled={!isMnemonicSaved} onClick={onNextStep}>Next step</Button>
      </ButtonArea>
    </>
  );
}

export default Mnemonic;
