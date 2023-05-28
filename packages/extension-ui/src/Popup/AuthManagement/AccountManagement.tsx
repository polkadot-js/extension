// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, ActionContext, Button, ButtonArea, RemoveAuth, ScrollWrapper } from '../../components';
import Checkbox from '../../components/Checkbox';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, updateAuthorization } from '../../messaging';
import { AccountSelection, Header } from '../../partials';
import AccountsTree from '../Accounts/AccountsTree';

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

const CustomButtonArea = styled(ButtonArea)`
  padding-top: 16px;
  padding-left: 32px;
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

  const StyledHeader = styled(Header)`
    &.backdrop-margin-left {
      margin-left: 0px;
    }
  `;

  return (
    <ScrollWrapper>
      <div className={className}>
        <StyledHeader
          text={t<string>('Connected accounts')}
          withBackArrow
          withBackdrop
          withHelp
        />
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
      </div>
    </ScrollWrapper>
  );
}

export default withRouter(styled(AccountManagement)`
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden scroll;
  margin: 0 -16px;

  ::-webkit-scrollbar-thumb {
      background: ${({ theme }: ThemeProps) => theme.boxBorderColor};
      border-radius: 50px;  
      width: 2px;  
      border-left: 2px solid #111B24;
    }
  
    ::-webkit-scrollbar {
      width: 4px;
    }

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
    flex-grow: 1;
    margin: 0px;
    
    ${Checkbox} {
      margin-right: 16px;
    }

    .accountList {
      height: 100%;

      ${AccountsTree} {
        width: calc(100% - 16px);
        margin: 0 auto;
      }
    }
  }
  

`);
