// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';

import helpIcon from '../../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  Button,
  ButtonArea,
  Checkbox,
  RadioGroup,
  ScrollWrapper,
  Svg,
  VerticalSpace
} from '../../components';
import HelperFooter from '../../components/HelperFooter';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { tieAccount } from '../../messaging';
import { Header } from '../../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

const CustomFooter = styled(HelperFooter)`
  gap: 12px;
`;

function EditNetwork({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const options = useGenesisHashOptions();

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const account = accounts.find((account) => account.address === address);

  const isExternal = Boolean(account?.isExternal);

  const [genesis, setGenesis] = useState<string | undefined | null>(account?.genesisHash);
  const [checked, setChecked] = useState(false);

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

  useEffect(() => {
    if (account && genesis !== account.genesisHash) {
      setHasGenesisChanged(true);
    }
  }, [account, genesis]);

  const footer = (
    <CustomFooter>
      <Svg
        className='icon'
        src={helpIcon}
      />
      <span>
        {t<string>('Not sure which to choose?')}&nbsp;
        <span className='link'>{t<string>('Learn more')}</span>
      </span>
    </CustomFooter>
  );

  return (
    <>
      <Header
        text={t<string>('Account network')}
        withBackArrow
        withHelp
      />
      <ScrollWrapper>
        <div className={className}>
          <div className='checkbox-container'>
            <Checkbox
              checked={checked}
              label={t<string>('Show test networks')}
              onChange={toggleChecked}
            />
          </div>
          <RadioGroup
            defaultSelectedValue={genesis}
            onSelectionChange={setGenesis}
            options={options}
            withTestNetwork={checked}
          />
        </div>
      </ScrollWrapper>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          onClick={_goTo(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDisabled={!hasGenesisChanged}
          onClick={_saveChanges}
        >
          {t<string>('Change')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(
  styled(EditNetwork)`
    display: flex;
    flex-direction: column;
    gap: 24px;

    .checkbox-container{
      display: flex;
      justify-content: center;
      align-items: center;
    }
`
);
