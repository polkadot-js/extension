// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, ButtonArea, Checkbox, InputWithLabel, Label, NextStepButton, VerticalSpace } from '../../components';
import { validateAccount } from '../../messaging';
import { DerivationPath } from '../../partials';
import { nextDerivationPath } from '../../util/nextDerivationPath';
import AddressDropdown from './AddressDropdown';

interface Props {
  isLocked?: boolean;
  parentAddress: string;
  onDerivationConfirmed: (derivation: { account: { address: string; suri: string }; parentPassword: string }) => void;
}

export function SelectParent ({ isLocked, onDerivationConfirmed, parentAddress }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const { accounts, hierarchy } = useContext(AccountContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [parentPassword, setParentPassword] = useState<string>('');
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [shouldAccountBeDerived, setShouldAccountBeDerived] = useState(true);

  const passwordInputRef = useRef<HTMLDivElement>(null);

  const _goCreate = useCallback(
    (): void => onAction('/account/create'),
    [onAction]
  );

  const _onParentPasswordEnter = useCallback(
    async (enteredPassword: string) => {
      setParentPassword(enteredPassword);
      setIsProperParentPassword(await validateAccount(parentAddress, enteredPassword));
    },
    [parentAddress]
  );

  const _onParentChange = useCallback(
    (address: string) => onAction(`/account/derive/${address}`),
    [onAction]
  );

  const _onSubmit = useCallback(
    () => parentPassword && account && onDerivationConfirmed({ account, parentPassword }),
    [account, parentPassword, onDerivationConfirmed]
  );

  useEffect(() => {
    setParentPassword('');
    setIsProperParentPassword(false);

    // eslint-disable-next-line no-unused-expressions
    passwordInputRef.current?.querySelector('input')?.focus();
  }, [_onParentPasswordEnter]);

  return (
    <>
      {!isLocked && (
        <CheckboxWithSmallerMargins
          checked={shouldAccountBeDerived}
          label='Derive new account from existing'
          onChange={setShouldAccountBeDerived}
        />
      )}
      <DisableableArea isDisabled={!shouldAccountBeDerived}>
        {isLocked ? (
          <Address address={parentAddress} />
        ) : (
          <Label label='Choose Parent Account:'>
            <AddressDropdown
              allAddresses={hierarchy.filter(({ isExternal }) => !isExternal).map(({ address }) => address)}
              onSelect={_onParentChange}
              selectedAddress={parentAddress}
            />
          </Label>
        )}
        <div ref={passwordInputRef}>
          <InputWithLabel
            data-export-password
            isError={!isProperParentPassword}
            isFocused
            label='enter the password for the account you want to derive from'
            onChange={_onParentPasswordEnter}
            type='password'
            value={parentPassword}
          />
        </div>
        {isProperParentPassword && (
          <DerivationPath
            defaultPath={nextDerivationPath(accounts, parentAddress)}
            onChange={setAccount}
            parentAddress={parentAddress}
            parentPassword={parentPassword}
          />
        )}
      </DisableableArea>
      <VerticalSpace/>
      <ButtonArea>
        {shouldAccountBeDerived
          ? (
            <NextStepButton
              data-button-action='create derived account'
              isDisabled={!isProperParentPassword || account === null}
              onClick={_onSubmit}
            >
              Create a derived account
            </NextStepButton>
          )
          : (
            <NextStepButton
              data-button-action='create root account'
              onClick={_goCreate}
            >
              Create account from new seed
            </NextStepButton>
          )
        }
      </ButtonArea>
    </>
  );
}

const CheckboxWithSmallerMargins = styled(Checkbox)`
  margin-top: 0;
  margin-bottom: 10px;
`;

const DisableableArea = styled.div<{ isDisabled: boolean }>`
  opacity: ${({ isDisabled }): string => isDisabled ? '0.2' : '1'};
  ${({ isDisabled }): string | false => isDisabled && 'pointer-events: none'};
`;
