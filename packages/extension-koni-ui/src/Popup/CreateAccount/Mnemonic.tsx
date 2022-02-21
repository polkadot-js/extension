// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { AccountInfoEl, ButtonArea, Checkbox, MnemonicSeed, NextStepButton, Warning } from '@polkadot/extension-koni-ui/components';
import { Theme, ThemeProps } from '@polkadot/extension-koni-ui/types';

import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  onNextStep: () => void;
  seed: string;
  address?: string;
  genesisHash?: string;
  name?: string;
  className?: string;
}

const onCopy = (): void => {
  const mnemonicSeedTextElement = document.querySelector('textarea');

  if (!mnemonicSeedTextElement) {
    return;
  }

  mnemonicSeedTextElement.select();
  document.execCommand('copy');
};

function Mnemonic ({ address, className, genesisHash, name, onNextStep, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false);
  const { show } = useToast();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _onCopy = useCallback((): void => {
    onCopy();
    show(t('Copied'));
  }, [show, t]);

  const _backupMnemonicSeed = useCallback(() => {
    const blob = new Blob([JSON.stringify(seed)], { type: 'application/json; charset=utf-8' });

    saveAs(blob, 'mnemonic-seed.json');
  }, [seed]);

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
            <AccountInfoEl
              address={address}
              genesisHash={genesisHash}
              name={name}
            />
            <MnemonicSeed
              backupMnemonicSeed={_backupMnemonicSeed}
              isShowDownloadButton
              onCopy={_onCopy}
              seed={seed}
            />
            <Warning className='create-account-warning'>
              {t<string>("Please write down your wallet's mnemonic seed and keep it in a safe place. The mnemonic can be used to restore your wallet. Keep it carefully to not lose your assets.")}
            </Warning>
            <Checkbox
              checked={isMnemonicSaved}
              label={t<string>('I have saved my mnemonic seed safely.')}
              onChange={setIsMnemonicSaved}
            />
          </div>
        </div>

        <ButtonArea className='kn-next-area'>
          <NextStepButton
            className='next-step-btn'
            isDisabled={!isMnemonicSaved}
            onClick={onNextStep}
          >
            {t<string>('Next Step')}
          </NextStepButton>
        </ButtonArea>
      </div>
    </>
  );
}

export default React.memo(styled(Mnemonic)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  overflow-y: auto;

  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }
`));
