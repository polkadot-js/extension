// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';

import {
  AccountContext,
  ActionContext,
  Button,
  ButtonArea,
  FaviconBox,
  RemoveAuth,
  VerticalSpace
} from '../../components';
import Checkbox from '../../components/Checkbox';
import useTranslation from '../../hooks/useTranslation';
import { getAuthList, removeAuthorization, updateAuthorization } from '../../messaging';
import { AccountSelection, Header } from '../../partials';

interface Props extends RouteComponentProps, ThemeProps {
  className?: string;
}

const CustomButtonArea = styled(ButtonArea)`
  padding-top: 16px;
  padding-bottom: 0px;
`;

function AccountManagement({ className, location: { search } }: Props): React.ReactElement<Props> {
  const { selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const searchParams = new URLSearchParams(search);
  const url = searchParams.get('url');

  const [authList, setAuthList] = useState<AuthUrls | null>(null);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const removeAuth = useCallback((url: string) => {
    removeAuthorization(url)
      .then(({ list }) => setAuthList(list))
      .catch(console.error);
  }, []);

  const _removeAuth = useCallback(() => url && removeAuth(url), [removeAuth, url]);

  useEffect(() => {
    getAuthList()
      .then(({ list }) => {
        if (url && !list[url]) {
          return;
        }

        if (url && setSelectedAccounts) {
          setSelectedAccounts(list[url].authorizedAccounts);
        }
      })
      .catch(console.error);
  }, [setSelectedAccounts, url]);

  const _onApprove = useCallback((): void => {
    if (!url) {
      return;
    }

    updateAuthorization(selectedAccounts, url)
      .then(() => onAction('..'))
      .catch(console.error);
  }, [onAction, selectedAccounts, url]);

  const _onCancel = useCallback((): void => {
    onAction('..');
  }, [onAction]);

  return (
    <>
      <Header
        smallMargin={true}
        text={t<string>('Connected accounts')}
        withBackArrow
      />
      <div className={className}>
        {url && (
          <>
            <FaviconBox url={url} />
            {/* TODO: make disconection flow, NEXT PR */}
            <RemoveAuth onRemove={_removeAuth} />
            <AccountSelection
              className='accountSelection'
              origin={origin}
              showHidden={true}
              url={url}
              withWarning={false}
            />
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
          onClick={_onApprove}
        >
          {t<string>('Change')}
        </Button>
      </CustomButtonArea>
    </>
  );
}

export default withRouter(styled(AccountManagement)`
  margin-top: -16px;
  .accountSelection{
    ${Checkbox} {
        margin-right: 16px;
      }
    .accountList{
      height: 350px;
      padding: 0px 8px;

    }
  }
  .acceptButton {
    width: 90%;
    margin: 0.5rem auto 0;
  }
`);
