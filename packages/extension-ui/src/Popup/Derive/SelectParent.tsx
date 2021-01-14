// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { canDerive } from '@polkadot/extension-base/utils';
import { assert } from '@polkadot/util';

import { AccountContext, ActionContext, Address, ButtonArea, InputWithLabel, Label, NextStepButton, VerticalSpace, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { validateAccount, validateDerivationPath } from '../../messaging';
import { nextDerivationPath } from '../../util/nextDerivationPath';
import AddressDropdown from './AddressDropdown';
import DerivationPath from './DerivationPath';

interface Props {
  className?: string;
  isLocked?: boolean;
  parentAddress: string;
  parentGenesis: string | null;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
}

export default function SelectParent ({ className, isLocked, onDerivationConfirmed, parentAddress, parentGenesis }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const { accounts, hierarchy } = useContext(AccountContext);
  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const [suriPath, setSuriPath] = useState<null | string>(defaultPath);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [isValidPath, setIsValidPath] = useState(true);
  const passwordInputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // forbid the use of password since Keyring ignored it
    if (suriPath?.includes('///')) {
      setIsValidPath(false);
    }
  }, [suriPath]);

  const allAddresses = useMemo(
    () => hierarchy
      .filter(({ isExternal }) => !isExternal)
      .filter(({ type }) => canDerive(type))
      .map(({ address, genesisHash }): [string, string | null] => [address, genesisHash || null]),
    [hierarchy]
  );

  const _onParentPasswordEnter = useCallback(
    (parentPassword: string): void => {
      setParentPassword(parentPassword);
      setIsProperParentPassword(!!parentPassword);
    },
    []
  );

  const _onSuriPathChange = useCallback(
    (path: string): void => {
      setSuriPath(path);
      setIsValidPath(true);
    },
    []
  );

  const _onParentChange = useCallback(
    (address: string) => onAction(`/account/derive/${address}`),
    [onAction]
  );

  const _onSubmit = useCallback(
    async (): Promise<void> => {
      if (suriPath && parentAddress && parentPassword) {
        setIsBusy(true);

        const isUnlockable = await validateAccount(parentAddress, parentPassword);

        if (isUnlockable) {
          try {
            const account = await validateDerivationPath(parentAddress, suriPath, parentPassword);

            assert(account, 'Unable to derive');
            onDerivationConfirmed({ account, parentPassword });
          } catch (error) {
            setIsBusy(false);
            setSuriPath(null);
          }
        } else {
          setIsBusy(false);
          setIsProperParentPassword(false);
        }
      }
    },
    [parentAddress, parentPassword, onDerivationConfirmed, suriPath]
  );

  useEffect(() => {
    setParentPassword('');
    setIsProperParentPassword(false);

    passwordInputRef.current?.querySelector('input')?.focus();
  }, [_onParentPasswordEnter]);

  return (
    <>
      <div className={className}>
        <div className=''>
          {isLocked
            ? (
              <Address
                address={parentAddress}
                genesisHash={parentGenesis}
              />
            )
            : (
              <Label label={t<string>('Choose Parent Account:')}>
                <AddressDropdown
                  allAddresses={allAddresses}
                  onSelect={_onParentChange}
                  selectedAddress={parentAddress}
                  selectedGenesis={parentGenesis}
                />
              </Label>
            )
          }
          <div ref={passwordInputRef}>
            <InputWithLabel
              data-input-password
              isError={!!parentPassword && !isProperParentPassword}
              isFocused
              label={t<string>('enter the password for the account you want to derive from')}
              onChange={_onParentPasswordEnter}
              type='password'
              value={parentPassword}
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
                isError={!suriPath || !isValidPath}
                onChange={_onSuriPathChange}
                parentAddress={parentAddress}
                parentPassword={parentPassword}
              />
              {(!suriPath || !isValidPath) && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {!suriPath
                    ? t('Incorrect derivation path')
                    : t('`///password` not supported for derivation')
                  }
                </Warning>
              )}
            </>
          )}
        </div>
      </div>
      <VerticalSpace/>
      <ButtonArea>
        <NextStepButton
          data-button-action='create derived account'
          isBusy={isBusy}
          isDisabled={!isProperParentPassword || !suriPath || !isValidPath}
          onClick={_onSubmit}
        >
          {t<string>('Create a derived account')}
        </NextStepButton>
      </ButtonArea>
    </>
  );
}
