// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';

import helpIcon from '../../assets/help.svg';
import infoIcon from '../../assets/information.svg';
import {
  ActionContext,
  Button,
  ButtonArea,
  InputLock,
  InputWithLabel,
  MnemonicInput,
  ScrollWrapper,
  Svg,
  VerticalSpace,
  Warning
} from '../../components';
import HelperFooter from '../../components/HelperFooter';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  genesis: string;
  path: string | null;
  seed: string | null;
  setPath: (path: string) => void;
  setSeed: (seed: string) => void;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
}

const CustomFooter = styled(HelperFooter)`
display: flex;
flex-direction: column;
.flex {
  display: flex;
  gap: 8px;
}
`;

interface StyledInputWithLabelProps extends ThemeProps {
  isLocked: boolean;
}

const StyledInputWithLabel = styled(InputWithLabel)`
max-width: 284px;
gap: 4px;
position: relative;
margin-bottom: 4px;

label {
color: ${({ isLocked, theme }: StyledInputWithLabelProps) => (isLocked ? theme.disabledTextColor : theme.subTextColor)};
opacity: 1;

}
`;

function SeedAndPath({
  className,
  genesis,
  onAccountChange,
  onNextStep,
  path,
  seed,
  setPath,
  setSeed,
  type
}: Props): React.ReactElement {
  const { t } = useTranslation();
  const [address, setAddress] = useState('');
  const [error, setError] = useState('');
  const [isLocked, setLocked] = useState<boolean>(true);
  const isValid = !!error && !!seed;

  const onAction = useContext(ActionContext);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

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
        onAccountChange(objectSpread<AccountInfo>({}, validatedAccount, { genesis, type }));
      })
      .catch(() => {
        onAccountChange(null);
        setError(path ? t<string>('Invalid secret phrase or path') : t<string>('Invalid secret phrase'));
      });
  }, [t, genesis, seed, path, onAccountChange, type, setError]);

  const _toggleLocked = useCallback(() => {
    setLocked((prevState) => !prevState);
  }, []);

  const footer = (
    <CustomFooter>
      <div className='flex'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={helpIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>('What is')}&nbsp;
            <span className='link'>{t<string>('Sub-account derivation path').toLowerCase()}</span>?
          </span>
        </div>
      </div>
      <div className='flex'>
        <Svg
          className='icon'
          src={infoIcon}
        />
        <span>
          {t<string>('Have')}&nbsp;
          <span
            className='link'
            onClick={goTo('/account/restore-json')}
          >
            {t<string>('JSON')}
          </span>
          &nbsp;
          {t<string>('file to import?')}
        </span>
      </div>
    </CustomFooter>
  );

  return (
    <>
      <ScrollWrapper>
        <div className={className}>
          <div className='text'>
            <span className='heading'>{t<string>('Enter your 12-word secret phrase')}</span>
            <span className='subtitle'>{t<string>(' You can paste it into any field.')}</span>
          </div>
          <div className='input-with-warning'>
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
            {isValid && <Warning isDanger>{error}</Warning>}
          </div>
          <div className='input-with-lock'>
            <StyledInputWithLabel
              className='derivationPath'
              disabled={isLocked}
              isError={!!path && !!error}
              isFocused
              isLocked={isLocked}
              label={t<string>('Sub-account derivation path')}
              onChange={setPath}
              value={path || ''}
            />
            <InputLock
              isLocked={isLocked}
              onClick={_toggleLocked}
            />
          </div>
          {isLocked && <span className='unlock-text'>{t<string>('Unlock to edit')}</span>}
        </div>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea footer={footer}>
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
    margin-top: 24px;
    gap: 8px;
    margin-bottom: 16px;

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

  .unlock-text {
    padding-left: 16px;
    color: ${theme.disabledTextColor};
    opacity: 0.65;
    font-weight: 300;
    font-size: 13px;
    line-height: 130%;
    letter-spacing: 0.06em;
  }

  .icon {
    position: absolute;
    right: 46px;
    top: 20px;
    color: ${theme.textColor};
  }

  .disabled-icon {
    opacity: 0.65;
  }

  .input-with-lock {
    display: flex;
    gap: 4px;
  }

  .input-with-warning {
    height: 202px;
  }
`
);
