// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';

import { ButtonArea, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import CreateEthDerivationPath from '../CreateAccount/CreateEthDerivationPath';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
  genesisHash: string;
}

function SeedAndPath ({ className, genesisHash, onAccountChange, onNextStep, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [customEthDerivationPath, setCustomEthDerivationPath] = useState<string>("m/44'/60'/0'/0/0");
  const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeed(suri, type, customEthDerivationPath)
      .then((validatedAccount) => {
        setError('');
        setAddress(validatedAccount.address);
        onAccountChange(
          objectSpread<AccountInfo>({}, validatedAccount, { genesisHash, type })
        );
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(path
          ? t<string>('Invalid mnemonic seed or derivation path')
          : t<string>('Invalid mnemonic seed')
        );
      });
  }, [t, genesisHash, seed, path, onAccountChange, type, customEthDerivationPath]);

  const _onToggleAdvanced = useCallback(() => {
    setAdvances(!advanced);
  }, [advanced]);

  return (
    <>
      <div className={className}>
        <TextAreaWithLabel
          className='seedInput'
          isError={!!error}
          isFocused
          label={t<string>('existing 12 or 24-word mnemonic seed')}
          onChange={setSeed}
          rowsCount={2}
          value={seed || ''}
        />
        {!!error && !seed && (
          <Warning
            className='seedError'
            isBelowInput
            isDanger
          >
            {t<string>('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
          </Warning>
        )}
        <div
          className='advancedToggle'
          onClick={_onToggleAdvanced}
        >
          <FontAwesomeIcon icon={advanced ? faCaretDown : faCaretRight} />
          <span>{t<string>('advanced')}</span>
        </div>
        { advanced && (type === 'ethereum'
          ? <CreateEthDerivationPath
            derivePath={customEthDerivationPath}
            onChange={setCustomEthDerivationPath}
            />
          : <InputWithLabel
            className='derivationPath'
            isError={!!path && !!error}
            label={t<string>('derivation path')}
            onChange={setPath}
            value={path || ''}
            />

        )}
        {!!error && !!seed && (
          <Warning
            isDanger
          >
            {error}
          </Warning>
        )}
      </div>
      <VerticalSpace />
      <ButtonArea>
        <NextStepButton
          isDisabled={!address || !!error}
          onClick={onNextStep}
        >
          {t<string>('Next')}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default styled(SeedAndPath)(({ theme }: ThemeProps) => `
  .advancedToggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: ${theme.lineHeight};
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;

    > span {
      font-size: ${theme.inputLabelFontSize};
      margin-left: .5rem;
      vertical-align: middle;
    }
  }

  .genesisSelection {
    margin-bottom: ${theme.fontSize};
  }

  .seedInput {
    margin-bottom: ${theme.fontSize};
    textarea {
      height: unset;
    }
  }

  .seedError {
    margin-bottom: 1rem;
  }
`);
