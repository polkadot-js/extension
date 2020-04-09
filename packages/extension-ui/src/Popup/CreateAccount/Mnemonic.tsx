// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';
import { ButtonArea, Checkbox, MnemonicSeed, NextStepButton, VerticalSpace, Warning } from '../../components';
import useToast from '../../hooks/useToast';
interface Props {
  onNextStep: () => void;
  seed: string;
}

const onCopy = (): void => {
  const mnemonicSeedTextElement = document.querySelector('textarea');

  if (!mnemonicSeedTextElement) {
    return;
  }

  mnemonicSeedTextElement.select();
  document.execCommand('copy');
};

function Mnemonic ({ onNextStep, seed }: Props): React.ReactElement<Props> {
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false);
  const { show } = useToast();
  const _onCopy = useCallback((): void => {
    onCopy();
    show('Copied');
  }, [show]);

  return (
    <>
      <Warning>Please write down your wallet’s mnemonic seed and keep it in a safe place. <br />
      Mnemonic seed is used to restore your wallet. Keep it carefully in case you lose your assets.</Warning>
      <MnemonicSeed
        onCopy={_onCopy}
        seed={seed}
      />
      <VerticalSpace />
      <Checkbox
        checked={isMnemonicSaved}
        label='I have saved my mnemonic seed safely.'
        onChange={setIsMnemonicSaved}
      />
      <ButtonArea>
        <NextStepButton
          isDisabled={!isMnemonicSaved}
          onClick={onNextStep}
        >
          Next step
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default Mnemonic;
