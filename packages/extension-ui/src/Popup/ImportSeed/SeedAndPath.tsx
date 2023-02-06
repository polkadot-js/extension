// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, ButtonArea, MnemonicInput, VerticalSpace } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  path: string | null;
  seed: string | null;
  setSeed: (seed: string) => void;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
}

function SeedAndPath({ className, onAccountChange, onNextStep, path, seed, setSeed, type }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [genesis, setGenesis] = useState('');
  const onAction = useContext(ActionContext);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  return (
    <>
      <div className={className}>
        <div className='text'>
          <span className='heading'>{t<string>('Enter your secret phrase')}</span>
          <span className='subtitle'>
            {t<string>('Enter your 12-word secret phrase to access your account.')}
            <span className='bold'>{t<string>(' You can paste it into any field.')}</span>
          </span>
        </div>
        <MnemonicInput
          error={error}
          genesis={genesis}
          onAccountChange={onAccountChange}
          onChange={setSeed}
          path={path}
          seed={seed}
          setAddress={setAddress}
          setError={setError}
          type={type}
        />
      </div>
      <VerticalSpace />
      <ButtonArea>
        <Button
          onClick={goTo('/')}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDisabled={!address || !!error}
          onClick={onNextStep}
        >
          {t<string>('Next')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default styled(SeedAndPath)(
  ({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: column;
  .text {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin-top: 32px;
    gap: 8px;
    margin-bottom: 40px;

    .heading {
      font-family: ${theme.secondaryFontFamily};
      color: ${theme.textColor};
      font-weight: 500;
      font-size: 16px;
      line-height: 125%;
      text-align: center;
      letter-spacing: 0.06em;
      }

    .subtitle {
      color: ${theme.subTextColor};
      font-size: 14px;
      line-height: 145%;
      text-align: center;
      letter-spacing: 0.07em;
      white-space: pre-line;

      & .bold {
        font-weight: 600;
      }
    }
}

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
`
);
