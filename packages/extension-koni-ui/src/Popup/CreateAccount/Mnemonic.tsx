// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { saveAs } from 'file-saver';
import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import AccountInfoContainer from '@polkadot/extension-koni-ui/components/AccountInfoContainer';
import ButtonArea from '@polkadot/extension-koni-ui/components/ButtonArea';
import Checkbox from '@polkadot/extension-koni-ui/components/Checkbox';
import MnemonicSeed from '@polkadot/extension-koni-ui/components/MnemonicSeed';
import NextStepButton from '@polkadot/extension-koni-ui/components/NextStepButton';
import Warning from '@polkadot/extension-koni-ui/components/Warning';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  onNextStep: () => void;
  seed: string;
  address?: any;
  genesisHash?: any;
  name?: any;
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

  const _onCopy = useCallback((): void => {
    onCopy();
    show(t('Copied'));
  }, [show, t]);

  const _backupMnemonicSeed = (): void => {
    const blob = new Blob([JSON.stringify(seed)], { type: 'application/json; charset=utf-8' });

    saveAs(blob, 'mnemonic-seed.json');
  };

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>
          <AccountInfoContainer
            address={address}
            genesisHash={genesisHash}
            name={name}
          >
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
          </AccountInfoContainer>
        </div>

        <ButtonArea className='kn-next-area'>
          <NextStepButton
            className='next-step-btn'
            isDisabled={!isMnemonicSaved}
            onClick={onNextStep}
          >
            {t<string>('Next step')}
          </NextStepButton>
        </ButtonArea>
      </div>
    </>
  );
}

export default React.memo(styled(Mnemonic)(({ theme }: Props) => `
  padding: 25px 15px 15px;
  flex: 1;
  margin-top: -25px;
  overflow-y: auto;
  .account-info-wrapper {

  }

    .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }
`));
