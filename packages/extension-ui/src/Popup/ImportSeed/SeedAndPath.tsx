// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { faCaretDown, faCaretRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';

import { ButtonArea, InputWithLabel, NextStepButton, TextAreaWithLabel, VerticalSpace, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface AccountInfo {
  address: string;
  suri: string;
}

interface Props {
  address?: string;
  className? : string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
}

function ImportSeed ({ address, className, onAccountChange, onNextStep }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [seed, setSeed] = useState<string | null>(null);
  const [path, setPath] = useState<string | null>(null);
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

    validateSeed(suri).then((newAccount) => {
      setError('');
      onAccountChange(newAccount);
    }).catch(() => {
      onAccountChange(null);
      setError(path
        ? t<string>('Invalid mnemonic seed or derivation path')
        : t<string>('Invalid mnemonic seed')
      );
    });
  }, [t, seed, path, onAccountChange]);

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
