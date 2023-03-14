// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect } from 'react';
import styled from 'styled-components';

import helpIcon from '../../assets/help.svg';
import { AccountContext, ActionContext, Button, ButtonArea, Svg } from '../../components';
import HelperFooter from '../../components/HelperFooter';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { approveAuthRequest, deleteAuthRequest } from '../../messaging';
import { AccountSelection } from '../../partials';
import NoAccount from './NoAccount';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

const CustomButtonArea = styled(ButtonArea)`
  padding: 0px;
  margin-bottom: 8px;
`;

const CustomFooter = styled(HelperFooter)`
  flex-direction: row;
  display: flex;
  gap: 8px;

  .icon-container {
    margin-top: 4px;
  }
  .text-container {
    display: flex;
    gap: 4px;
  }

  .group {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    margin-left: -32px;
  }
`;

function Request({ authId, className, isFirst, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { accounts, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { show } = useToast();

  useEffect(() => {
    const defaultAccountSelection = accounts
      .filter(({ isDefaultAuthSelected }) => !!isDefaultAuthSelected)
      .map(({ address }) => address);

    setSelectedAccounts && setSelectedAccounts(defaultAccountSelection);
  }, [accounts, setSelectedAccounts]);

  const _onApprove = useCallback(async (): Promise<void> => {
    try {
      await approveAuthRequest(authId, selectedAccounts);
      onAction();
      show(t('App connected'), 'success');
    } catch (error) {
      console.error(error);
    }
  }, [authId, onAction, selectedAccounts, show, t]);

  const _onClose = useCallback((): void => {
    deleteAuthRequest(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error));
  }, [authId, onAction]);

  if (!accounts.length) {
    return <NoAccount authId={authId} />;
  }

  const footer = (
    <CustomFooter>
      <div className='group'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={helpIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>('Only connect with sites you trust.')}&nbsp;
            <br />
            <span className='link'>{t<string>('Learn more')}</span>
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  return (
    <div className={className}>
      <AccountSelection url={url} />
      <CustomButtonArea footer={footer}>
        <Button
          data-accept-request-button
          onClick={_onClose}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        {isFirst && <Button onClick={_onApprove}>{t<string>('Connect')}</Button>}
      </CustomButtonArea>
    </div>
  );
}

export default styled(Request)`
  padding: 0px 16px;
`;
