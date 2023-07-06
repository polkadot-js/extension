// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { FormEvent, useCallback, useContext, useEffect, useId, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';

import helpIcon from '../../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  BottomWrapper,
  Button,
  ButtonArea,
  Checkbox,
  HelperFooter,
  LearnMore,
  RadioGroup,
  ScrollWrapper,
  Svg,
} from '../../components';
import { ALEPH_ZERO_TESTNET_GENESIS_HASH } from '../../constants';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
import { tieAccount } from '../../messaging';
import { Header } from '../../partials';

function EditNetwork({
  match: {
    params: { address }
  }
}: RouteComponentProps<{ address: string }>): React.ReactElement<RouteComponentProps<{ address: string }>> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const options = useGenesisHashOptions();

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const account = accounts.find((account) => account.address === address);

  const isExternal = Boolean(account?.isExternal);

  const [genesis, setGenesis] = useState<string | undefined | null>(account?.genesisHash);
  const isTestNet = account?.genesisHash === ALEPH_ZERO_TESTNET_GENESIS_HASH;
  const [checked, setChecked] = useState(isTestNet);

  const toggleChecked = useCallback(() => setChecked((checked) => !checked), []);

  const _saveChanges = useCallback(async (): Promise<void> => {
    try {
      await tieAccount(address, genesis || null);
      onAction(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`);
      show(t<string>('Account network changed successfully!'), 'success');
    } catch (error) {
      console.error(error);
    }
  }, [address, genesis, isExternal, onAction, show, t]);

  const [hasGenesisChanged, setHasGenesisChanged] = useState(false);

  const formId = useId();

  useEffect(() => {
    if (account && genesis !== account.genesisHash) {
      setHasGenesisChanged(true);
    }
  }, [account, genesis]);

  const footer = (
    <CustomFooter>
      <div className='wrapper'>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('Not sure which to choose?')}&nbsp;
          <LearnMore href={LINKS.NETWORK} />
        </span>
      </div>
    </CustomFooter>
  );

  const isFormValid = hasGenesisChanged;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFormValid) {
      _saveChanges();
    }
  };

  return (
    <>
      <Header
        className='header'
        text={t<string>('Account network')}
        withBackArrow
        withHelp
      />
      <StyledScrollWrapper>
        <Form
          id={formId}
          onSubmit={onSubmit}
        >
          <CheckboxContainer>
            <Checkbox
              checked={checked}
              label={t<string>('Show test networks')}
              onChange={toggleChecked}
            />
          </CheckboxContainer>
          <RadioGroup
            defaultSelectedValue={genesis}
            onSelectionChange={setGenesis}
            options={options}
            withTestNetwork={checked}
          />
          {footer}
        </Form>
        <CustomButtonArea>
          <Button
            onClick={_goTo(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`)}
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
            {t<string>('Change')}
          </Button>
        </CustomButtonArea>
      </StyledScrollWrapper>
    </>
  );
}

const StyledScrollWrapper = styled(ScrollWrapper)`
  ${BottomWrapper} {
    margin-inline: -16px;
    padding-inline: 16px;
  }
`;

const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 24px;
`;

const CustomFooter = styled(HelperFooter)`
  width: auto;
  margin-bottom: 24px;
  gap: 12px;

  .wrapper {
    display: flex;
    gap: 8px;
    margin-left: -12px;
  };
`;

const CustomButtonArea = styled(ButtonArea)`
  padding-top:8px;
`;

const CheckboxContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;

export default withRouter(EditNetwork);
