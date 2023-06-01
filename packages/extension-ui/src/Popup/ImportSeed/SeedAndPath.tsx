// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeypairType } from '@polkadot/util-crypto/types';
import type { ThemeProps } from '../../types';
import type { AccountInfo } from '.';

import React, { FormEvent, useCallback, useContext, useEffect, useId, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { objectSpread } from '@polkadot/util';

import helpIcon from '../../assets/help.svg';
import infoIcon from '../../assets/information.svg';
import {
  ActionContext,
  Button,
  ButtonArea,
  Header,
  HelperFooter,
  InputLock,
  InputWithLabel,
  LearnMore,
  MnemonicInput,
  ScrollWrapper,
  Svg,
  VerticalSpace,
  Warning
} from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
import { EMPTY_SEED_WORDS, SEED_WORDS_LENGTH } from './consts';

interface Props {
  className?: string;
  genesis: string;
  onNextStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
  type: KeypairType;
}

const CustomFooter = styled(HelperFooter)`
  display: flex;
  gap: 0px;
  flex-direction: column;

  .text-container {
    display: flex;
    align-items: flex-start;
  }

  .flex {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    
  }

  ::before {
    width: calc(100% - 32px);
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
  color: ${({ isLocked, theme }: StyledInputWithLabelProps) =>
    isLocked ? theme.disabledTextColor : theme.subTextColor};
  opacity: 1;
}
`;

function SeedAndPath({ className, genesis, onAccountChange, onNextStep, type }: Props): React.ReactElement {
  const { t } = useTranslation();

  const [seedWords, setSeedWords] = useState<string[]>(EMPTY_SEED_WORDS);
  const [path, setPath] = useState<string>('');

  const [address, setAddress] = useState('');
  const [error, setError] = useState('');

  const [isLocked, setLocked] = useState<boolean>(true);

  const onAction = useContext(ActionContext);

  const formId = useId();

  const onSeedWordsChange = (nextSeedWords: string[]) => {
    if (nextSeedWords.every((word) => !word)) {
      setError(t('This field is required'));
    }

    setSeedWords([...nextSeedWords, ...EMPTY_SEED_WORDS].slice(0, SEED_WORDS_LENGTH));
  };

  const hasSomeSeedWords = seedWords.some((word) => word);

  useEffect(() => {
    // No need to validate an empty seed
    // we have a dedicated error for this

    if (!hasSomeSeedWords) {
      setError('');
      onAccountChange(null);

      return;
    }

    const seed = seedWords.join(' ');
    const suri = seed + path;

    validateSeed(suri, type)
      .then((validatedAccount) => {
        setError('');
        setAddress(validatedAccount.address);
        onAccountChange(objectSpread<AccountInfo>({}, validatedAccount, { genesis, type }));
      })
      .catch(() => {
        setAddress('');
        onAccountChange(null);
        setError(path ? t<string>('Invalid secret phrase or path') : t<string>('Invalid secret phrase'));
      });
  }, [t, hasSomeSeedWords, genesis, seedWords, path, onAccountChange, type, setError, setAddress]);

  const _toggleLocked = useCallback(() => {
    setLocked((prevState) => !prevState);
  }, []);

  const _onClick = useCallback(() => {
    onAction('/account/restore-json');
  }, [onAction]);

  const isFormValid = Boolean(address && !error);

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
            <LearnMore href={LINKS.DERIVE_SUB_ACCOUNT}>
              {t<string>('Sub-account derivation path').toLowerCase()}
            </LearnMore>
            ?
          </span>
        </div>
      </div>
      <div className='flex'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={infoIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>('Have')}&nbsp;
            <span
              className='link'
              onClick={_onClick}
            >
              {t<string>('JSON')}
            </span>
            &nbsp;{t<string>('file to import?')}
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      onNextStep();
    }
  };

  return (
    <>
      <ScrollWrapper>
        <form
          className={className}
          id={formId}
          onSubmit={onSubmit}
        >
          <StyledHeader
            text={t<string>('You can paste it into any field.')}
            title={t<string>('Enter your 12-word secret phrase')}
          />
          <MnemonicWrapper>
            <MnemonicInput
              onChange={onSeedWordsChange}
              seedWords={seedWords}
              showError={!!error}
            />
            {!!error && (
              <Warning
                className='centered'
                isDanger
              >
                {error}
              </Warning>
            )}
          </MnemonicWrapper>
          <div className='input-with-lock'>
            <StyledInputWithLabel
              className='derivationPath'
              disabled={isLocked}
              isError={!!path && !!error}
              isFocused
              isLocked={isLocked}
              label={t<string>('Sub-account derivation path')}
              onChange={setPath}
              value={path}
            />
            <InputLock
              isLocked={isLocked}
              onClick={_toggleLocked}
            />
          </div>
          {isLocked && <span className='unlock-text'>{t<string>('Unlock to edit')}</span>}
        </form>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          onClick={window.close}
          secondary
          type='button'
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          form={formId}
          isDisabled={!isFormValid}
          type='submit'
        >
          {t<string>('Next')}
        </Button>
      </ButtonArea>
    </>
  );
}

const StyledHeader = styled(Header)`
  margin-bottom: 24px;
`;

const MnemonicWrapper = styled.div`
  margin-bottom: 24px;

  & > :not(:last-child) {
    margin-bottom: 8px;
  }
`;

export default styled(SeedAndPath)(
  ({ theme }: ThemeProps) => `
  display: flex;
  flex-direction: column;


  .centered {
    margin: 0 auto;
    display: flex;
    justify-content: center;
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
    padding-bottom: 16px;
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

  .input-with-warning > :not(:last-child) {
    margin-bottom: 8px;
  }
`
);
