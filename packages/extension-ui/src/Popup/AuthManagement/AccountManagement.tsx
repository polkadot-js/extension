// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Button, ButtonArea, RemoveAuth, VerticalSpace } from '../../components';
import Checkbox from '../../components/Checkbox';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, updateAuthorization } from '../../messaging';
import { AccountSelection, Header } from '../../partials';

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

const CustomButtonArea = styled(ButtonArea)`
  padding-top: 16px;
  padding-bottom: 0px;
`;

function AccountManagement({ className, location: { search } }: Props): React.ReactElement<Props> {
  const { hierarchy, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const searchParams = new URLSearchParams(search);
  const url = searchParams.get('url');
  const [selectedAccountsChanged, setSelectedAccountsChanged] = useState(false);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => {
        if (url && !list[url]) {
          return;
        }

        if (url && setSelectedAccounts) {
          setSelectedAccounts(list[url].authorizedAccounts);
          setSelectedAccountsChanged(false);
        }
      })
      .catch(console.error);
  }, [setSelectedAccounts, url]);

  const _onApprove = useCallback((): void => {
    if (!url) {
      return;
    }

    updateAuthorization(selectedAccounts, url)
      .then(() => onAction('/auth-list'))
      .catch(console.error);
  }, [onAction, selectedAccounts, url]);

  const _onCancel = useCallback((): void => {
    onAction('/auth-list');
  }, [onAction]);

  return (
    <>
      <Header
        text={t<string>('Connected accounts')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        {url && (
          <>
            <RemoveAuth url={url} />
            {hierarchy.length > 0 ? (
              <AccountSelection
                className='accountSelection'
                onChange={setSelectedAccountsChanged}
                showHidden={true}
                url={url}
                withWarning={false}
              />
            ) : (
              <div className='no-accounts'>
                <span>{t<string>('You do NOT have any account.')}</span>
              </div>
            )}
          </>
        )}
      </div>
      <VerticalSpace />
      <CustomButtonArea>
        <Button
          onClick={_onCancel}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          className='acceptButton'
          isDisabled={!selectedAccountsChanged}
          onClick={_onApprove}
        >
          {t<string>('Change')}
        </Button>
      </CustomButtonArea>
    </>
  );
}

export default withRouter(styled(AccountManagement)`
  overflow: hidden;

  .no-accounts {
    box-sizing: border-box;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    padding: 16px;
    gap: 8px;
    height: 80px;
    margin-top: 16px;
    border: 1px dashed #1B2B38;
    border-radius: 8px;
  }

  .accountSelection {
    ${Checkbox} {
      margin-right: 16px;
    }

    .accountList {
      height: 350px;
      padding: 0px 8px;
    }
  }
  
  .acceptButton {
    width: 90%;
    margin: 0.5rem auto 0;
  }
`);
