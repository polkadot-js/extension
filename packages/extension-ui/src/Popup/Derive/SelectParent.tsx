// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';

import helpIcon from '../../assets/help.svg';
import viewOff from '../../assets/viewOff.svg';
import viewOn from '../../assets/viewOn.svg';
import {
  AccountContext,
  ActionContext,
  Address,
  Button,
  ButtonArea,
  InputWithLabel,
  Label,
  LearnMore,
  Svg,
  ValidatedInput,
  VerticalSpace,
  Warning
} from '../../components';
import HelperFooter from '../../components/HelperFooter';
import { useGoTo } from '../../hooks/useGoTo';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
import { validateAccount, validateDerivationPath } from '../../messaging';
import { nextDerivationPath } from '../../util/nextDerivationPath';
import { isNotShorterThan } from '../../util/validators';
import AddressDropdown from './AddressDropdown';
import DerivationPath from './DerivationPath';

interface Props extends ThemeProps {
  className?: string;
  isLocked?: boolean;
  parentAddress: string;
  parentGenesis: string | null;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
  onNextStep: () => void;
  externalString: string;
}

// match any single slash
const singleSlashRegex = /([^/]|^)\/([^/]|$)/;

const StyledFooter = styled(HelperFooter)`
  .icon {
    margin-bottom: 12px;
  }
  gap: 8px;
`;

const MIN_PASSWORD_LENGTH = 0;

function SelectParent({
  className,
  externalString,
  isLocked,
  onDerivationConfirmed,
  onNextStep,
  parentAddress,
  parentGenesis
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const { accounts, hierarchy } = useContext(AccountContext);
  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const [suriPath, setSuriPath] = useState<null | string>(defaultPath);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [pathError, setPathError] = useState('');
  const passwordInputRef = useRef<HTMLDivElement>(null);
  const allowSoftDerivation = useMemo(() => {
    const parent = accounts.find(({ address }) => address === parentAddress);

    return parent?.type === 'sr25519';
  }, [accounts, parentAddress]);

  // reset the password field if the parent address changes
  useEffect(() => {
    setParentPassword('');
  }, [parentAddress]);

  useEffect(() => {
    // forbid the use of password since Keyring ignores it
    if (suriPath?.includes('///')) {
      setPathError(t('`///password` not supported for derivation'));
    }

    if (!allowSoftDerivation && suriPath && singleSlashRegex.test(suriPath)) {
      setPathError(t('Soft derivation is only allowed for sr25519 accounts'));
    }
  }, [allowSoftDerivation, suriPath, t]);

  const allAddresses = useMemo(
    () =>
      hierarchy
        .filter(({ isExternal }) => !isExternal)
        .filter(({ type }) => canDerive(type))
        .map(({ address, genesisHash }): [string, string | null] => [address, genesisHash || null]),
    [hierarchy]
  );

  const _onParentPasswordEnter = useCallback((parentPassword: string): void => {
    setParentPassword(parentPassword);
    setIsProperParentPassword(!!parentPassword);
  }, []);

  const _onSuriPathChange = useCallback((path: string): void => {
    setSuriPath(path);
    setPathError('');
  }, []);

  const _onParentChange = useCallback((address: string) => onAction(`/account/derive/${address}`), [onAction]);

  const _onSubmit = useCallback(async (): Promise<void> => {
    if (suriPath && parentAddress && parentPassword) {
      setIsBusy(true);

      const isUnlockable = await validateAccount(parentAddress, parentPassword);

      if (isUnlockable) {
        try {
          const account = await validateDerivationPath(parentAddress, suriPath, parentPassword);

          onDerivationConfirmed({ account, parentPassword });
          onNextStep();
        } catch (error) {
          setIsBusy(false);
          setPathError(t('Invalid derivation path'));
          console.error(error);
        }
      } else {
        setIsBusy(false);
        setIsProperParentPassword(false);
      }
    }
  }, [suriPath, parentAddress, parentPassword, onDerivationConfirmed, onNextStep, t]);

  useEffect(() => {
    setParentPassword('');
    setIsProperParentPassword(false);

    passwordInputRef.current?.querySelector('input')?.focus();
  }, [_onParentPasswordEnter]);

  const { goTo } = useGoTo();

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const _handleInputTypeChange = useCallback(() => {
    setIsPasswordVisible(!isPasswordVisible);
  }, [isPasswordVisible]);

  const isPasswordValid = useMemo(() => isNotShorterThan(MIN_PASSWORD_LENGTH, t<string>('Password is too short')), [t]);

  const footer = (
    <StyledFooter>
      <Svg
        className='icon'
        src={helpIcon}
      />
      <span>
        {t<string>('What is the difference between an\naccount and a sub-account?')}&nbsp;
        <LearnMore href={LINKS.DERIVE_SUB_ACCOUNT} />
      </span>
    </StyledFooter>
  );

  return (
    <>
      <div className={className}>
        <div className='text'>
          <span className='heading'>{t<string>('Add sub-account')}</span>
          <span className='subtitle'>
            {t<string>('Choose a sub-account derivation path for additional account organization.')}
          </span>
        </div>
        {isLocked ? (
          <Address
            address={parentAddress}
            genesisHash={parentGenesis}
          />
        ) : (
          <Label label={t<string>('Choose Parent Account:')}>
            <AddressDropdown
              allAddresses={allAddresses}
              onSelect={_onParentChange}
              selectedAddress={parentAddress}
              selectedGenesis={parentGenesis}
            />
          </Label>
        )}
        <div ref={passwordInputRef}>
          <ValidatedInput
            component={InputWithLabel}
            data-input-password
            label={t<string>('Main account password')}
            onValidatedChange={_onParentPasswordEnter}
            showPasswordElement={
              <button className='password-icon'>
                <img
                  onClick={_handleInputTypeChange}
                  src={isPasswordVisible ? viewOn : viewOff}
                />
              </button>
            }
            type={isPasswordVisible ? 'text' : 'password'}
            validator={isPasswordValid}
          />
          {!!parentPassword && !isProperParentPassword && (
            <Warning
              isBelowInput
              isDanger
            >
              {t('Wrong password')}
            </Warning>
          )}
        </div>
        {isProperParentPassword && (
          <>
            <DerivationPath
              defaultPath={defaultPath}
              isError={!!pathError}
              onChange={_onSuriPathChange}
              parentAddress={parentAddress}
              parentPassword={parentPassword}
              withSoftPath={allowSoftDerivation}
            />
            {!!pathError && (
              <Warning
                isBelowInput
                isDanger
              >
                {pathError}
              </Warning>
            )}
          </>
        )}
      </div>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          isDisabled={isBusy}
          onClick={goTo(`/account/edit-menu/${parentAddress}?isExternal=${externalString}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          data-button-action='create derived account'
          isBusy={isBusy}
          isDisabled={!isProperParentPassword || !!pathError}
          onClick={_onSubmit}
        >
          {t<string>('Next')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default React.memo(
  styled(SelectParent)(
    ({ theme }: Props) => `
    margin-top: 24px;
    margin-right: 8px;

    .text {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
      gap: 8px;

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
      }
    }
`
  )
);
