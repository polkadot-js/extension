// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import styled from 'styled-components';

import helpIcon from '../assets/help.svg';
import { ALEPH_ZERO_GENESIS_HASH } from '../constants';
import useGenesisHashOptions from '../hooks/useGenesisHashOptions';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import { Name, Password } from '../partials';
import { getUserInputs } from './PasswordField/getFeedback';
import Address from './Address';
import BackButton from './BackButton';
import Button from './Button';
import ButtonArea from './ButtonArea';
import { AccountContext } from './contexts';
import Dropdown from './Dropdown';
import Header from './Header';
import HelperFooter from './HelperFooter';
import LearnMore from './LearnMore';
import Svg from './Svg';

type Props = {
  address: string | null | undefined;
  buttonLabel?: string;
  className?: string;
  genesisHash: string | null;
  isBusy: boolean;
  onBackClick?: () => void;
  onCreate: (name: string, password: string) => void;
  onPasswordChange?: (password: string) => void;
  isImporting?: boolean;
  parentName?: string | null;
} & (
  | {
      setGenesis: (newGenesisHash: string) => void;
      isDeriving?: false;
    }
  | {
      setGenesis?: never;
      isDeriving: true;
    }
);

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
  setGenesis
}: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const { t } = useTranslation();
  const options = useGenesisHashOptions();
  const { master } = useContext(AccountContext);

  const _onCreate = useCallback(() => {
    if (name && password) {
      onCreate(name, password);
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

  const _onChangeNetwork = useCallback((newGenesisHash: string) => setGenesis?.(newGenesisHash), [setGenesis]);

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

  return (
    <>
      <Container className={className}>
        <StyledHeader
          text={t<string>('Choose how your new account is displayed and protected it in Aleph Zero Signer.')}
          title={t<string>('Visibility & security')}
        />
        <StyledAddress
          address={address}
          genesisHash={genesisHash}
          name={name}
          parentName={parentName}
        />
        <InputsWrapper>
          <Name
            isFocused
            onChange={setName}
          />
          <Password
            label={isDeriving ? t<string>('Set sub-account password') : undefined}
            onChange={_onPasswordChange}
            validationUserInput={getUserInputs(name)}
          />
        </InputsWrapper>
        {!isDeriving && (
          <>
            <StyledDropdown
              className={className}
              label={t<string>('Show on network')}
              onChange={_onChangeNetwork}
              options={options}
              value={genesisHash || ALEPH_ZERO_GENESIS_HASH}
            />
            {footer}
          </>
        )}
      </Container>
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

const Container = styled.div`
  margin-right: 8px;
  margin-bottom: auto;
`;

const StyledHeader = styled(Header)`
  margin-bottom: 32px;
`;

const StyledAddress = styled(Address)`
  margin-bottom: 24px;
`;

const InputsWrapper = styled.div`
  & > * {
    margin-bottom: 16px;
  }
`;

const StyledDropdown = styled(Dropdown)`
  margin-bottom: 40px;
`;

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

const StyledButtonArea = styled(ButtonArea)`
  margin-right: -8px;
`;

export default React.memo(AccountNamePasswordCreation);
