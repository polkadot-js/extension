// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AuthorizeTabRequestPayload } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { FormEvent, useCallback, useContext, useEffect, useId } from 'react';
import styled from 'styled-components';

import helpIcon from '../../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  Button,
  ButtonArea,
  HelperFooter,
  LearnMore,
  Svg,
  VerticalSpace
} from '../../components';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { LINKS } from '../../links';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';
import { AccountSelection } from '../../partials';
import NoAccount from './NoAccount';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  payload: AuthorizeTabRequestPayload;
  url: string;
  isLast: boolean;
}

const CustomFooter = styled(HelperFooter)`
  flex-direction: row;
  display: flex;
  gap: 8px;  

  .icon {
    margin-bottom: 4px;
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

function Request({ authId, className, isFirst, isLast, url }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const formId = useId();

  const { accounts, selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);

  const { t } = useTranslation();
  const { show } = useToast();

  useEffect(() => {
    const rejectAuth = () => rejectAuthRequest(authId);

    window.addEventListener('beforeunload', rejectAuth);

    return () => window.removeEventListener('beforeunload', rejectAuth);
  }, [authId]);

  useEffect(() => {
    const defaultAccountSelection = accounts
      .filter(({ isDefaultAuthSelected }) => !!isDefaultAuthSelected)
      .map(({ address }) => address);

    setSelectedAccounts && setSelectedAccounts(defaultAccountSelection);
  }, [accounts, setSelectedAccounts]);

  const _onApprove = useCallback(async (): Promise<void> => {
    try {
      await approveAuthRequest(authId, selectedAccounts);
      show(t('App connected'), 'success');

      const params = new URLSearchParams({
        isLast: isLast.toString(),
        isSuccess: 'true',
        message: t<string>('Authorization granted')
      });

      onAction(`/request-status?${params.toString()}`);
    } catch (error) {
      console.error(error);
    }
  }, [authId, isLast, onAction, selectedAccounts, show, t]);

  const _onClose = useCallback(async () => {
    try {
      await rejectAuthRequest(authId);

      const params = new URLSearchParams({
        isLast: isLast.toString(),
        isSuccess: 'false',
        message: t<string>('Authorization declined')
      });

      onAction(`/request-status?${params.toString()}`);
    } catch (error) {
      console.error(error);
    }

  }, [authId, isLast, onAction, t]);

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
            <LearnMore href={LINKS.TRUSTED_APPS} />
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  const isFormValid = isFirst;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isFormValid) {
      _onApprove();
    }
  };

  return (
    <>
      <form
        className={className}
        id={formId}
        onSubmit={onSubmit}
      >
        <AccountSelection url={url} />
      </form>
      <VerticalSpace />
      <ButtonArea footer={footer}>
        <Button
          data-accept-request-button
          onClick={_onClose}
          secondary
          type='button'
        >
          {t<string>('Cancel')}
        </Button>
        {isFirst && (
          <Button
            form={formId}
            type='submit'
          >
            {t<string>('Connect')}
          </Button>
        )}
      </ButtonArea>
    </>
  );
}

export default styled(Request)`
  .accountList {
    padding-right: 8px;
    padding-bottom: 16px;
    height: 100%;
  }
`;
