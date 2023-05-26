// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import styled from 'styled-components';

import useToast from '@polkadot/extension-ui/hooks/useToast';

import {
  AccountContext,
  AccountNamePasswordCreation,
  ActionContext,
  BottomWrapper,
  ButtonArea,
  ScrollWrapper
} from '../../components';
import { useGoTo } from '../../hooks/useGoTo';
import useTranslation from '../../hooks/useTranslation';
import { deriveAccount } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import SelectParent from './SelectParent';

interface Props {
  className?: string;
  isLocked?: boolean;
}

interface AddressState {
  address: string;
}

interface PathState extends AddressState {
  suri: string;
}

interface ConfirmState {
  account: PathState;
  parentPassword: string;
}

const StyledAccountNamePasswordCreation = styled(AccountNamePasswordCreation)`
 ~ ${BottomWrapper} ${ButtonArea} {
    margin-right: 0px;
  }
`;

function Derive({ isLocked }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const { address: parentAddress } = useParams<AddressState>();
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | PathState>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const { show } = useToast();

  const parentGenesis = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.genesisHash || null,
    [accounts, parentAddress]
  );

  const parentIsExternal = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.isExternal || 'false',
    [accounts, parentAddress]
  );

  const parentName = useMemo(
    () => accounts.find((a) => a.address === parentAddress)?.name || null,
    [accounts, parentAddress]
  );

  const _onCreate = useCallback(
    (name: string, password: string) => {
      if (!account || !name || !password || !parentPassword) {
        return;
      }

      setIsBusy(true);
      deriveAccount(parentAddress, account.suri, parentPassword, name, password, parentGenesis)
        .then(() => {
          show(t('Creating a sub-account successfully!'), 'success');
          onAction('/');
        })
        .catch((error): void => {
          setIsBusy(false);
          show(t('Sub-account creation was not successful.'), 'critical');
          console.error(error);
        });
    },
    [account, onAction, parentAddress, parentGenesis, parentPassword, show, t]
  );

  const _onDerivationConfirmed = useCallback(({ account, parentPassword }: ConfirmState) => {
    setAccount(account);
    setParentPassword(parentPassword);
  }, []);

  const { goTo } = useGoTo();

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  return (
    <ScrollWrapper>
      <HeaderWithSteps
        step={step}
        text={t<string>('Derive sub-account')}
        total={2}
        withBackArrow
        withBackdrop
        withMargin
      />
      {!account && step === 1 && (
        <SelectParent
          externalString={parentIsExternal.toString()}
          isLocked={isLocked}
          onDerivationConfirmed={_onDerivationConfirmed}
          onNextStep={_onNextStep}
          parentAddress={parentAddress}
          parentGenesis={parentGenesis}
        />
      )}
      {account && step === 2 && (
        <StyledAccountNamePasswordCreation
          address={account.address}
          buttonLabel={t<string>('Create')}
          genesisHash={parentGenesis}
          isBusy={isBusy}
          isDeriving
          onBackClick={goTo(`/account/edit-menu/${parentAddress}?isExternal=${parentIsExternal?.toString()}`)}
          onCreate={_onCreate}
          parentName={parentName}
        />
      )}
    </ScrollWrapper>
  );
}

export default React.memo(Derive);
