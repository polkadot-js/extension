// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { AccountInfo } from './index.js';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';

import { ButtonArea, Dropdown, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../../components/index.js';
import { useGenesisHashOptions, useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  className?: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
}

function SeedAndPath ({ className, onAccountChange, onNextStep, type }: Props): React.ReactElement {
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

    validateSeed(suri, type)
      .then((validatedAccount) => {
        setError('');
        setAddress(validatedAccount.address);
        onAccountChange(
          objectSpread<AccountInfo>({}, validatedAccount, { genesis, type })
        );
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(path
          ? t('Invalid mnemonic seed or derivation path')
          : t('Invalid mnemonic seed')
        );
      });
  }, [t, genesis, seed, path, onAccountChange, type]);

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
          label={t('existing 12 or 24-word mnemonic seed')}
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
            {t('Mnemonic needs to contain 12, 15, 18, 21, 24 words')}
          </Warning>
        )}
        <Dropdown
          className='genesisSelection'
          label={t('Network')}
          onChange={setGenesis}
          options={genesisOptions}
          value={genesis}
        />
        <div
          className='advancedToggle'
          onClick={_onToggleAdvanced}
        >
          <FontAwesomeIcon icon={advanced ? faCaretDown : faCaretRight} />
          <span>{t('advanced')}</span>
        </div>
        { advanced && (
          <InputWithLabel
            className='derivationPath'
            isError={!!path && !!error}
            label={t('derivation path')}
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
          {t('Next')}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}

export default styled(SeedAndPath)<Props>`
  .advancedToggle {
    color: var(--textColor);
    cursor: pointer;
    line-height: var(--lineHeight);
    letter-spacing: 0.04em;
    opacity: 0.65;
    text-transform: uppercase;

    > span {
      font-size: var(--inputLabelFontSize);
      margin-left: .5rem;
      vertical-align: middle;
    }
  }

  .genesisSelection {
    margin-bottom: var(--fontSize);
  }

  .seedInput {
    margin-bottom: var(--fontSize);
    textarea {
      height: unset;
    }
  }

  .seedError {
    margin-bottom: 1rem;
  }
`;
