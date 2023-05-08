// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import helpIcon from '../assets/help.svg';
import { BackButton, Button, Dropdown, LearnMore, Svg } from '../components';
import Address from '../components/Address';
import ButtonArea from '../components/ButtonArea';
import { ALEPH_ZERO_GENESIS_HASH } from '../constants';
import useGenesisHashOptions from '../hooks/useGenesisHashOptions';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import { Name, Password } from '../partials';
import { ThemeProps } from '../types';
import { AccountContext } from './contexts';
import HelperFooter from './HelperFooter';

const APP_RELATED_INPUTS = ['aleph', 'zero', 'aleph zero', 'signer'];

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
  isDeriving?: boolean;
  isImporting?: boolean;
  parentName?: string;
}

const CustomFooter = styled(HelperFooter)`
  flex-direction: row;
  display: flex;
  gap: 8px;
  width: auto;
  margin-bottom: 8px;

  .wrapper {
    display: flex;
    flex-direction: row;
    gap: 8px;
    margin-left: -12px;
  }

  .text-container {
    display: flex;
    gap: 4px;
  }
`;

const StyledAddress = styled(Address)`
  margin-bottom: 16px;
`;

const StyledButtonArea = styled(ButtonArea)`
  margin-right: -8px;
`;

function AccountNamePasswordCreation({
  address,
  buttonLabel,
  className,
  genesisHash,
  isBusy,
  isDeriving = false,
  onBackClick,
  onCreate,
  onPasswordChange,
  parentName,
  setGenesis,
}: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { t } = useTranslation();
  const options = useGenesisHashOptions();
  const { master } = useContext(AccountContext);

  const _onCreate = useCallback(async () => {
    if (name && password) {
      await onCreate(name, password);
    }
  }, [name, password, onCreate]);

  const _onPasswordChange = useCallback(
    (password: string | null) => {
      onPasswordChange && onPasswordChange(password || '');
      setPassword(password);
    },
    [onPasswordChange]
  );

  const _onBackClick = useCallback(() => {
    setPassword(null);
    onBackClick && onBackClick();
  }, [onBackClick]);

  const _onChangeNetwork = useCallback((newGenesisHash: string) => setGenesis(newGenesisHash), [setGenesis]);

  const footer = (
    <CustomFooter>
      <div className='wrapper'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={helpIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>("Don't know which network to choose?")}&nbsp;
            <br />
            <LearnMore href={LINKS.NETWORK} />
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  const nameRelatedInputs = name ? [name, ...name.split(/[^a-zA-Z]+/)] : [];
  const validationUserInput = [
    ...APP_RELATED_INPUTS,
    ...nameRelatedInputs,
  ];

  return (
    <>
      <div className={className}>
        <div className='text'>
          <span className='heading'>{t<string>('Visibility & security')}</span>
          <span className='subtitle'>
            {t<string>('Choose how your new account is displayed and protected it in Aleph Zero Signer.')}
          </span>
        </div>
        <StyledAddress
          address={address}
          genesisHash={genesisHash}
          name={name}
          parentName={parentName}
        />
        <Name
          isFocused
          onChange={setName}
        />
        <Password
          label={isDeriving ? t<string>('Set sub-account password') : undefined}
          onChange={_onPasswordChange}
          validationUserInput={validationUserInput}
        />
        {!isDeriving && (
          <Dropdown
            className={className}
            label={t<string>('Show on network')}
            onChange={_onChangeNetwork}
            options={options}
            value={genesisHash || ALEPH_ZERO_GENESIS_HASH}
          />
        )}
        {!isDeriving && footer}
      </div>
      {onBackClick && buttonLabel && (
        <StyledButtonArea>
          {master && isDeriving ? (
            <Button
              onClick={_onBackClick}
              secondary
            >
              {t<string>('Cancel')}
            </Button>
          ) : (
            <BackButton onClick={_onBackClick} />
          )}
          <Button
            data-button-action='add new root'
            isBusy={isBusy}
            isDisabled={!password || !name}
            onClick={_onCreate}
          >
            {buttonLabel}
          </Button>
        </StyledButtonArea>
      )}
    </>
  );
}

export default React.memo(styled(AccountNamePasswordCreation)`
  margin-right: 8px;

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
