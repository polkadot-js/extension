// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useState } from 'react';
import styled from 'styled-components';

import helpIcon from '../assets/help.svg';
import { Address, Button, Dropdown, HelperFooter, ScrollWrapper } from '../components';
import useGenesisHashOptions from '../hooks/useGenesisHashOptions';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { Name, Password } from '../partials';
import { ThemeProps } from '../types';
import { BackButton, ButtonArea, VerticalSpace } from '.';

interface Props {
  address: string | null;
  buttonLabel?: string;
  className?: string;
  genesisHash: string;
  setGenesis: (newGenesisHash: string) => void;
  isBusy: boolean;
  onBackClick?: () => void;
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  onNameChange: (name: string) => void;
  onPasswordChange?: (password: string) => void;
}

function AccountNamePasswordCreation({
  address,
  buttonLabel,
  className,
  genesisHash,
  isBusy,
  onBackClick,
  onCreate,
  onNameChange,
  onPasswordChange,
  setGenesis
}: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { t } = useTranslation();
  const { show } = useToast();
  const options = useGenesisHashOptions();

  const _onCreate = useCallback(async () => {
    if (name && password) {
      show(t('Import successful'), 'success');
      await onCreate(name, password);
    }
  }, [show, t, name, password, onCreate]);

  const _onNameChange = useCallback(
    (name: string | null) => {
      onNameChange(name || '');
      setName(name);
    },
    [onNameChange]
  );

  const _onPasswordChange = useCallback(
    (password: string | null) => {
      onPasswordChange && onPasswordChange(password || '');
      setPassword(password);
    },
    [onPasswordChange]
  );

  const _onBackClick = useCallback(() => {
    _onNameChange(null);
    setPassword(null);
    onBackClick && onBackClick();
  }, [_onNameChange, onBackClick]);

  const _onChangeNetwork = useCallback((newGenesisHash: string) => setGenesis(newGenesisHash), [setGenesis]);

  const footer = (
    <HelperFooter>
      <img
        className='icon'
        src={helpIcon}
      />
      <span>
        {t<string>('When should you choose the network?')}&nbsp;
        <br />
        <span className='link'>{t<string>('Learn more')}</span>
      </span>
    </HelperFooter>
  );

  return (
    <>
      <ScrollWrapper>
        <div className={className}>
          <div className='text'>
            <span className='heading'>{t<string>('Visibility & security')}</span>
            <span className='subtitle'>
              {t<string>('Choose how your new account is displayed and protected it in Aleph Zero Signer.')}
            </span>
          </div>
          <Address
            address={address}
            genesisHash={genesisHash}
            name={name}
          />
          <Name
            isFocused
            onChange={_onNameChange}
          />
          <Password onChange={_onPasswordChange} />
          <Dropdown
            className={className}
            label={t<string>('Show on network')}
            onChange={_onChangeNetwork}
            options={options}
            value={genesisHash}
          />
        </div>
      </ScrollWrapper>
      <VerticalSpace />
      {onBackClick && buttonLabel && (
        <ButtonArea footer={footer}>
          <BackButton onClick={_onBackClick} />
          <Button
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
            onClick={_onCreate}
          >
            {buttonLabel}
          </Button>
        </ButtonArea>
      )}
    </>
  );
}

export default React.memo(styled(AccountNamePasswordCreation)`

  .spacer {
    height: 16px;
  }

.text {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 32px;
  margin-bottom: 32px;
  gap: 8px;
  
  .heading {
    font-family: ${({ theme }: ThemeProps): string => theme.secondaryFontFamily};
    color: ${({ theme }: ThemeProps): string => theme.textColor};
    font-weight: 500;
    font-size: 16px;
    line-height: 125%;
    text-align: center;
    letter-spacing: 0.06em;
  }
    
  .subtitle {
    color: ${({ theme }: ThemeProps): string => theme.subTextColor};
    font-size: 14px;
    line-height: 145%;
    text-align: center;
    letter-spacing: 0.07em;
    white-space: pre-line;
  }
}
`);
