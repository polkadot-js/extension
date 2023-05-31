// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { FormEvent, useCallback, useContext, useId, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Address, Button, ButtonArea, VerticalSpace } from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { editAccount } from '../../messaging';
import { Header, Name } from '../../partials';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function EditName({
  className,
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const account = accounts.find((account) => account.address === address);

  const isExternal = account?.isExternal || 'false';

  const [editedName, setName] = useState<string | undefined | null>(account?.name);

  const formId = useId();

  const _saveChanges = useCallback(async (): Promise<void> => {
    if (editedName) {
      try {
        await editAccount(address, editedName);
        onAction(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`);
        show(t<string>('Account name changed successfully'), 'success');
      } catch (error) {
        console.error(error);
      }
    }
  }, [editedName, address, onAction, isExternal, show, t]);

  const isFormValid = editedName && editedName !== account?.name;

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isFormValid) {
      _saveChanges();
    }
  };

  return (
    <>
      <Header
        text={t<string>('Account name')}
        withBackArrow
        withHelp
      />
      <form
        className={className}
        id={formId}
        onSubmit={onSubmit}
      >
        <Address
          address={address}
          name={editedName || t('<unknown>')}
        />
        <div className='name'>
          <Name
            label=' '
            onChange={setName}
            value={account?.name}
          />
        </div>
      </form>
      <VerticalSpace />
      <ButtonArea>
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
          {t<string>('Save')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default withRouter(
  styled(EditName)`
    display: flex;
    flex-direction: column;
    gap: 24px;
`
);
