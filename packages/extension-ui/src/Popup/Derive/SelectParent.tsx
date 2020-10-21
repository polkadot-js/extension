// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { assert } from '@polkadot/util';

import { AccountContext, ActionContext, Address, ButtonArea, Checkbox, InputWithLabel, Label, NextStepButton, VerticalSpace } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { validateAccount, validateDerivationPath } from '../../messaging';
import { nextDerivationPath } from '../../util/nextDerivationPath';
import AddressDropdown from './AddressDropdown';
import DerivationPath from './DerivationPath';

interface Props extends ThemeProps {
  className?: string;
  isLocked?: boolean;
  parentAddress: string;
  parentGenesis: string | null;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
}

function SelectParent ({ className, isLocked, onDerivationConfirmed, parentAddress, parentGenesis }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const { accounts, hierarchy } = useContext(AccountContext);
  const defaultPath = useMemo(() => nextDerivationPath(accounts, parentAddress), [accounts, parentAddress]);
  const [suriPath, setSuriPath] = useState<null | string>(defaultPath);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [shouldAccountBeDerived, setShouldAccountBeDerived] = useState(true);
  const passwordInputRef = useRef<HTMLDivElement>(null);

  const allAddresses = useMemo(
    () => hierarchy
      .filter(({ isExternal }) => !isExternal)
      .map(({ address, genesisHash }): [string, string | null] => [address, genesisHash || null]),
    [hierarchy]
  );

  const _goCreate = useCallback(
    () => onAction('/account/create'),
    [onAction]
  );

  const _onParentPasswordEnter = useCallback(
    (parentPassword: string): void => {
      setParentPassword(parentPassword);
      setIsProperParentPassword(!!parentPassword);
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
            setSuriPath(null);
          }
        } else {
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
        {!isLocked && (
          <Checkbox
            checked={shouldAccountBeDerived}
            className='smallerMargin'
            label={t<string>('Derive new account from existing')}
            onChange={setShouldAccountBeDerived}
          />
        )}
        <div className={`disableArea ${shouldAccountBeDerived ? '' : 'disabled'}`}>
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
              data-export-password
              isError={!isProperParentPassword}
              isFocused
              label={t<string>('enter the password for the account you want to derive from')}
              onChange={_onParentPasswordEnter}
              type='password'
              value={parentPassword}
            />
          </div>
          {isProperParentPassword && (
            <DerivationPath
              defaultPath={defaultPath}
              onChange={setSuriPath}
              parentAddress={parentAddress}
              parentPassword={parentPassword}
            />
          )}
        </div>
      </div>
      <VerticalSpace/>
      <ButtonArea>
        {shouldAccountBeDerived
          ? (
            <NextStepButton
              data-button-action='create derived account'
              isBusy={isBusy}
              isDisabled={!isProperParentPassword || !suriPath}
              onClick={_onSubmit}
            >
              {t<string>('Create a derived account')}
            </NextStepButton>
          )
          : (
            <NextStepButton
              data-button-action='create root account'
              onClick={_goCreate}
            >
              {t<string>('Create account from new seed')}
            </NextStepButton>
          )
        }
      </ButtonArea>
    </>
  );
}

export default styled(SelectParent)`

  .smallerMargin {
    margin-top: 0;
    margin-bottom: 10px;
  }

  .disableArea {
    opacity: 1;

    .disabled {
      opacity: 0.2;
      pointer-events: none;
    }
  }
`;
