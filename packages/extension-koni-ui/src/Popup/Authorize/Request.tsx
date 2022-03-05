// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@polkadot/extension-base/background/types';
import type { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

// import ConnectAccount from '@polkadot/extension-koni-ui/Popup/Authorize/ConnectAccount';
import { ActionContext, Button } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveAuthRequest, rejectAuthRequest } from '../../messaging';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function Request ({ authId, className, request: { origin }, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  // const { hierarchy } = useContext(AccountContext);
  // const accounts = hierarchy.filter((acc) => acc.address !== 'ALL');
  const { hostname } = new URL(url);

  const _onApprove = useCallback(
    () => approveAuthRequest(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction]
  );

  const _onReject = useCallback(
    () => rejectAuthRequest(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction]
  );

  return (
    <div className={className}>
      <div className='request-info-wrapper'>
        <img
          alt={`${hostname}`}
          className='request-info__connected-app-logo'
          src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
        />
        <div className='request-info-connected-app__text'>
          {origin}
        </div>

        <div className='request-info-connected-app__title'>
          {t<string>('Connect the SubWallet')}
        </div>
        <a
          className='request-info-url'
          href={url}
          rel='noopener noreferrer'
          target='_blank'
        >
          <span className='tab-url'>{url}</span>
        </a>
      </div>
      {/* <div className='request-info-choose-account'> */}
      {/*  {t<string>('Choose the account(s) you’d like to connect')} */}
      {/* </div> */}
      {/* <div className='request__accounts'> */}
      {/*  {accounts.map((acc) => ( */}
      {/*    <ConnectAccount */}
      {/*      address={acc.address} */}
      {/*      genesisHash={acc.genesisHash} */}
      {/*      key={acc.address} */}
      {/*      name={acc.name} */}
      {/*      type={acc.type} */}
      {/*    /> */}
      {/*  ))} */}
      {/* </div> */}
      <div className='authorize-request__warning'>
        {t<string>('Make sure you trust this site before connecting')}
      </div>
      <div className='authorize-request-bottom-content'>
        <Button
          className='authorize-request__btn'
          onClick={_onReject}
        >
          <span>{t<string>('Cancel')}</span>
        </Button>
        <Button
          className='authorize-request__btn'
          onClick={_onApprove}
        >
          {t<string>('Connect')}
        </Button>
      </div>
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;
  padding: 25px 22px 22px;

  .request-info-url {
    text-align: center;
    padding-top: 10px;
    padding-bottom: 60px;
  }

  .request-info-connected-app__title {
    font-size: 24px;
    line-height: 36px;
    font-weight: 500;
    text-align: center;
  }

  .request-info-connected-app__text {
    font-size: 14px;
    // line-height: 24px;
    color: ${theme.textColor2};
    padding-top: 8px;
    padding-bottom: 13px;
  }

  .request-info__connected-app-logo {
    height: 56px;
    min-width: 56px;
    padding-right: 9px;
  }

  .request-info-choose-account {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    padding-bottom: 18px;
  }

  .request__accounts {
    flex: 1;
    overflow-y: auto;
  }

  .authorize-request__account .account-info-row {
    height: auto;
  }

  .authorize-request-bottom-content {
    display: flex;
    padding-top: 16px;
  }

  .authorize-request__btn {
    flex: 1;
  }

  .authorize-request__btn:first-child {
    background-color: #181E42;
    margin-right: 8px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .authorize-request__btn:last-child {
    margin-left: 8px;
  }

  .authorize-request__warning {
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    text-align: center;
    padding-bottom: 30px;
  }

  .tab-info {
    overflow: hidden;
    margin-top: 0.75rem;
  }

  .tab-url {
    color: ${theme.textColor2};
    display: inline-block;
    max-width: 20rem;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: top;
    cursor: pointer;
    text-align: center;
    text-decoration: underline;
    font-size: 14px;
    line-height: 24px;
  }

  .request-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8px;
    padding-top: 30px;
  }

  .request-info {
    display: flex;
    flex-direction: row;
    padding-top: 20px;
  }
`);
