// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';

import { ButtonArea, Checkbox, MnemonicSeed, NextStepButton, VerticalSpace, Warning } from '../../components/index.js';
import useToast from '../../hooks/useToast.js';
import useTranslation from '../../hooks/useTranslation.js';

interface Props {
  onNextStep: () => void;
  seed: string;
}

function Mnemonic ({ onNextStep, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false);
  const { show } = useToast();

  const _onCopy = useCallback((): void => {
    show(t<string>('Copied'));
  }, [show, t]);

  return (
    <>
      <MnemonicSeed
        onCopy={_onCopy}
        seed={seed}
      />
      <Warning>
        {t<string>("Please write down your wallet's mnemonic seed and keep it in a safe place. The mnemonic can be used to restore your wallet. Keep it carefully to not lose your assets.")}
      </Warning>
      <VerticalSpace />
      <Checkbox
        checked={isMnemonicSaved}
        label={t<string>('I have saved my mnemonic seed safely.')}
        onChange={setIsMnemonicSaved}
      />
      <ButtonArea>
        <NextStepButton
          isDisabled={!isMnemonicSaved}
          onClick={onNextStep}
        >
          {t<string>('Next step')}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default React.memo(Mnemonic);
