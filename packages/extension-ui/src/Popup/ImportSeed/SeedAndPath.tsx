// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';

import { ButtonArea, Dropdown, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { AccountInfo } from '.';

interface Props {
  className? : string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
}

function ImportSeed ({ className, onAccountChange, onNextStep }: Props): React.ReactElement {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions();
  const [address, setAddress] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
  const [advanced, setAdvances] = useState(false);
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this
    if (!seed) {
      onAccountChange(null);

      return;
    }

    const suri = `${seed || ''}${path || ''}`;

    validateSeed(suri).then((newAccount) => {
      setError('');
      setAddress(newAccount.address);
      onAccountChange({ ...newAccount, genesis });
    }).catch(() => {
      setAddress('');
      onAccountChange(null);
      setError(path
        ? t<string>('Invalid mnemonic seed or derivation path')
        : t<string>('Invalid mnemonic seed')
      );
    });
  }, [t, seed, path, onAccountChange, genesis]);

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
        <Dropdown
          className='genesisSelection'
          label={t<string>('Network')}
          onChange={setGenesis}
          options={genesisOptions}
          value={genesis}
        />
        <div
          className='advancedToggle'
          onClick={_onToggleAdvanced}
        >
          <FontAwesomeIcon icon={advanced ? faCaretDown : faCaretRight}/>
          <span>{t<string>('advanced')}</span>
        </div>
        { advanced && (
          <InputWithLabel
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

export default styled(ImportSeed)(({ theme }: ThemeProps) => `
  .advancedToggle {
    color: ${theme.textColor};
    cursor: pointer;
    line-height: 14px;
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;

    > span {
      font-size: 10px;
      margin-left: .5rem;
      vertical-align: middle;
    }
  }

  .genesisSelection {
    margin-bottom: 1rem;
  }

  .seedInput {
    margin-bottom: 16px;
    textarea {
      height: unset;
    }
  }

  .seedError {
    margin-bottom: 1rem;
  }
`);
