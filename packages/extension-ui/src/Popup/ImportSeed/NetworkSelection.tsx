// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import { validateSeed } from '@polkadot/extension-ui/messaging';
import { AccountInfo } from '@polkadot/types/interfaces';
import { objectSpread } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';

import {
  Address,
  BackButton,
  Button,
  ButtonArea,
  Dropdown,
  InputWithLabel,
  VerticalSpace,
  Warning
} from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { ThemeProps } from '../../types';

interface Props extends ThemeProps {
  address: string | null;
  className?: string;
  onChange: (genesis: string) => void;
  options: string;
  value: string;
  path: string;
  setPath: (path: string) => void;
  onNextStep: () => void;
  seed: string | null;
  type: KeypairType;
  onPreviousStep: () => void;
  onAccountChange: (account: AccountInfo | null) => void;
}

function NetworkSelection({
  address,
  className,
  onAccountChange,
  onChange,
  onNextStep,
  onPreviousStep,
  options,
  path,
  seed,
  setPath,
  type,
  value
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState('');

  const _onToggleAdvanced = useCallback(() => {
    setAdvanced(!advanced);
  }, [advanced]);

  useEffect(() => {
    console.log(path);
  }, [path]);

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
        onAccountChange(objectSpread<AccountInfo>({}, validatedAccount, { genesis: value, type }));
      })
      .catch(() => {
        onAccountChange(null);
        setError(path ? t<string>('Invalid mnemonic seed or derivation path') : t<string>('Invalid secret phrase'));
      });
  }, [t, value, seed, path, onAccountChange, type, setError]);

  console.log(path, !!(path && path?.length > 0));

  return (
    <>
      <div className={className}>
        <Address address={address} />
        <Dropdown
          className='genesisSelection'
          label={t<string>('Network')}
          onChange={onChange}
          options={options}
          value={value}
        />
        <div
          className='advancedToggle'
          onClick={_onToggleAdvanced}
        >
          <FontAwesomeIcon icon={advanced ? faChevronDown : faChevronUp} />
          <span>{t<string>('Advanced')}</span>
        </div>
        {advanced && (
          <InputWithLabel
            className='derivationPath'
            isError={!!path}
            label={t<string>('Sub-account path')}
            onChange={setPath}
            value={path}
          />
        )}
        {!!error && !!seed && path.length !== 0 && <Warning isDanger>{error}</Warning>}
      </div>
      <VerticalSpace />
      <ButtonArea>
        <BackButton onClick={onPreviousStep} />
        <Button
          data-button-action='add new root'
          onClick={onNextStep}
        >
          {t<string>('Next')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(NetworkSelection)(
    ({ theme }: ThemeProps) => `
    margin-top: 20px;
    
    .advancedToggle {
        color: ${theme.textColor};
        cursor: pointer;
        line-height: ${theme.lineHeight};
        letter-spacing: 0.04em;
        opacity: 0.65;
        margin-top: 16px;
    
        > span {
          font-size: ${theme.inputLabelFontSize};
          margin-left: 8px;
          vertical-align: middle;
        }
      }

`
  )
);
