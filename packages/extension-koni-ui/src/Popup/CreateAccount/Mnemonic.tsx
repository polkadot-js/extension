// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountInfoEl, ButtonArea, Checkbox, MnemonicSeed, NextStepButton } from '@subwallet/extension-koni-ui/components';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/Popup/CreateAccount/index';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  onNextStep: () => void;
  seed: string;
  address?: string;
  evmAddress?: string,
  evmName?: string,
  name?: string;
  className?: string;
  onSelectAccountCreated?: (keyTypes: KeypairType[]) => void
}

const onCopy = (): void => {
  const mnemonicSeedTextElement = document.querySelector('textarea');

  if (!mnemonicSeedTextElement) {
    return;
  }

  mnemonicSeedTextElement.select();
  document.execCommand('copy');
};

function Mnemonic ({ address, className, evmAddress, evmName, name, onNextStep, onSelectAccountCreated, seed }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [isMnemonicSaved, setIsMnemonicSaved] = useState(false);
  const [isNormalAccountSelected, setNormalAccountSelected] = useState(false);
  const [isEvmAccountSelected, setEvmAccountSelected] = useState(false);
  const { show } = useToast();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _onCopy = useCallback((): void => {
    onCopy();
    show(t('Copied'));
  }, [show, t]);

  const _onSelectNormalAccount = useCallback(() => {
    if (!isNormalAccountSelected) {
      if (isEvmAccountSelected) {
        onSelectAccountCreated && onSelectAccountCreated([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountCreated && onSelectAccountCreated([SUBSTRATE_ACCOUNT_TYPE]);
      }
    } else {
      if (isEvmAccountSelected) {
        onSelectAccountCreated && onSelectAccountCreated([EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountCreated && onSelectAccountCreated([]);
      }
    }

    setNormalAccountSelected(!isNormalAccountSelected);
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountCreated]);

  const _onSelectEvmAccount = useCallback(() => {
    if (!isEvmAccountSelected) {
      if (isNormalAccountSelected) {
        onSelectAccountCreated && onSelectAccountCreated([SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE]);
      } else {
        onSelectAccountCreated && onSelectAccountCreated([EVM_ACCOUNT_TYPE]);
      }
    } else {
      if (isNormalAccountSelected) {
        onSelectAccountCreated && onSelectAccountCreated([SUBSTRATE_ACCOUNT_TYPE]);
      } else {
        onSelectAccountCreated && onSelectAccountCreated([]);
      }
    }

    setEvmAccountSelected(!isEvmAccountSelected);
  }, [isEvmAccountSelected, isNormalAccountSelected, onSelectAccountCreated]);

  const _backupMnemonicSeed = useCallback(() => {
    const blob = new Blob([JSON.stringify(seed)], { type: 'application/json; charset=utf-8' });

    saveAs(blob, 'mnemonic-seed.json');
  }, [seed]);

  return (
    <>
      <div className={className}>
        <div className='account-info-wrapper'>
          <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
            {address &&
              <div className='account-info-item'>
                <Checkbox
                  checked={isNormalAccountSelected}
                  label={''}
                  onChange={_onSelectNormalAccount}
                />
                <AccountInfoEl
                  address={address}
                  className='account-info-item__info'
                  name={name}
                />
              </div>
            }
            {evmAddress &&
              <div className='account-info-item'>
                <Checkbox
                  checked={isEvmAccountSelected}
                  label={''}
                  onChange={_onSelectEvmAccount}
                />
                <AccountInfoEl
                  address={evmAddress}
                  className='account-info-item__info'
                  name={evmName}
                  type={EVM_ACCOUNT_TYPE}
                />
              </div>
            }
            <MnemonicSeed
              backupMnemonicSeed={_backupMnemonicSeed}
              isShowDownloadButton
              onCopy={_onCopy}
              seed={seed}
              tooltipContent={t<string>("Please write down your wallet's mnemonic seed and keep it in a safe place. The mnemonic can be used to restore your wallet. Keep it carefully to not lose your assets.")}
            />
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
            isDisabled={!isMnemonicSaved || (!isNormalAccountSelected && !isEvmAccountSelected)}
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

  .account-info-item {
    display: flex;
    align-items: center;
  }

  .account-info-item__info {
    width: 100%;
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
