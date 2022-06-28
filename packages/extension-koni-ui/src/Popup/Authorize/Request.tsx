// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RequestAuthorizeTab } from '@subwallet/extension-base/background/types';
import type { ThemeProps } from '../../types';

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { filterAndSortingAccountByAuthType } from '@subwallet/extension-koni-base/utils/utils';
import ConfirmModal from '@subwallet/extension-koni-ui/components/ConfirmModal';
import ConnectAccount from '@subwallet/extension-koni-ui/Popup/Authorize/ConnectAccount';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import rejectIcon from '../../assets/reject-icon.svg';
import { AccountContext, ActionContext, Button, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { approveAuthRequestV2, cancelAuthRequestV2, rejectAuthRequestV2 } from '../../messaging';

interface Props extends ThemeProps {
  authId: string;
  className?: string;
  isFirst: boolean;
  request: RequestAuthorizeTab;
  url: string;
}

function stripUrl (url: string): string {
  if (url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('ipfs:') || url.startsWith('ipns:'))) {
    const parts = url.split('/');

    return parts[2];
  }

  return url;
}

function Request ({ authId, className, request: { accountAuthType, allowedAccounts, origin }, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const accountList = filterAndSortingAccountByAuthType(accounts, accountAuthType || 'substrate', true);

  const [isShowConfirmRejectModal, setShowConfirmModal] = useState(false);

  const { hostname } = new URL(url);
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(allowedAccounts || []);
  const [isSelectedAll, setIsSelectedAll] = useState(true);

  const _onApprove = useCallback(
    () => approveAuthRequestV2(authId, selectedAccounts)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction, selectedAccounts]
  );

  useEffect(() => {
    const notInSelected = accountList.find((acc) => !selectedAccounts.includes(acc.address));

    setIsSelectedAll(!notInSelected);
  }, [accountList, selectedAccounts]);

  const _onOpenConfirmRejectModal = useCallback(() => {
    setShowConfirmModal(true);
  },
  []
  );

  const _onCloseRejectModal = useCallback(() => {
    setShowConfirmModal(false);
  },
  []
  );

  const _onReject = useCallback(() => {
    rejectAuthRequestV2(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error));
  },
  [authId, onAction]
  );

  const _onCancel = useCallback(
    () => cancelAuthRequestV2(authId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error)),
    [authId, onAction]
  );

  return (
    <div className={className}>
      <div className='request-content'>
        <div className='request-info-wrapper'>
          <div className='request-info-connected-app'>
            <img
              alt={`${hostname}`}
              className='request-info__connected-app-logo'
              src={`https://icons.duckduckgo.com/ip2/${hostname}.ico`}
            />
            <div className='request-info-connected-app__text'>
              {origin}
            </div>
          </div>
          <a
            className='request-info-url'
            href={url}
            rel='noopener noreferrer'
            target='_blank'
          >
            <span className='tab-url'>{stripUrl(url)}</span>
          </a>
        </div>

        {accountList && accountList.length
          ? (
            <>
              <div className='request-info-choose-account'>
                {t<string>('Choose the account(s) you’d like to connect')}
              </div>
              <div className='request__accounts'>
                <ConnectAccount
                  address={ALL_ACCOUNT_KEY}
                  isSelected={isSelectedAll}
                  name={t<string>('Select all')}
                  selectAccountCallBack={setSelectedAccounts}
                  selectedAccounts={accountList.map((account) => account.address)}
                />
                {accountList.map((acc) => (
                  <ConnectAccount
                    address={acc.address}
                    genesisHash={acc.genesisHash}
                    isSelected={selectedAccounts.includes(acc.address)}
                    key={acc.address}
                    name={acc.name}
                    selectAccountCallBack={setSelectedAccounts}
                    selectedAccounts={selectedAccounts}
                    type={acc.type}
                  />
                ))}
              </div>
            </>
          )
          : <Warning>
            {accountAuthType === 'evm' ? t<string>('You don\'t have any evm account. Please create, import or restore an account to continue') : t<string>('You don\'t have any substrate account. Please create, import or restore an account to continue')}
          </Warning>
        }

      </div>
      <div className='request-footer'>
        <div className='authorize-request__warning'>
          {t<string>('Make sure you trust this site before connecting')}
        </div>
        <div className='authorize-request-bottom-content'>
          <Button
            className='authorize-request__btn'
            onClick={_onOpenConfirmRejectModal}
          >
            <img
              alt='Icon'
              src={rejectIcon}
            />
          </Button>
          <Button
            className='authorize-request__btn'
            onClick={_onCancel}
          >
            <span>{t<string>('Cancel')}</span>
          </Button>
          <Button
            className='authorize-request__btn'
            isDisabled={selectedAccounts.length === 0}
            onClick={_onApprove}
          >
            {t<string>('Connect')}
          </Button>
        </div>
      </div>

      {isShowConfirmRejectModal &&
        <ConfirmModal
          closeModal={_onCloseRejectModal}
          confirmAction={_onReject}
          confirmButton={'Reject'}
          confirmMessage={'Are you sure to reject website access?'}
        />
      }
    </div>
  );
}

export default styled(Request)(({ theme }: Props) => `
  display: flex;
  flex: 1;
  overflow-y: auto;
  flex-direction: column;
  
  .request-content {
    flex: 1;
    overflow-y: auto;
    padding: 22px 18px 22px 22px;
  }
  
  .request-footer {
    padding: 12px 22px 22px;
  }

  .request-info-url {
    text-align: center;
  }

  .request-info-connected-app {
    border-radius: 5px;
    padding: 6px;
    background-color: ${theme.backgroundAccountAddress};
    margin-bottom: 10px;
    display: flex;
    justify-content: center;
    align-item: center;
  }

  .request-info-connected-app__text {
    font-size: 14px;
    // line-height: 24px;
    color: ${theme.textColor2};
  }

  .request-info__connected-app-logo {
    height: 28px;
    min-height: 28px;
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
    padding-right: 6px;
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
    background-color: ${theme.buttonBackgroundDanger};
    margin-right: 8px;
    flex: 0;
    
    .children {
      display: flex;
    }

    span {
      color: ${theme.buttonTextColor};
    }
  }

  .authorize-request__btn:nth-child(2) {
    background-color: ${theme.buttonBackground1};
    margin-right: 8px;

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .authorize-request__warning {
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
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
    text-decoration: none;
    font-size: 14px;
    line-height: 24px;
  }

  .request-info-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8px;
  }

  .request-info {
    display: flex;
    flex-direction: row;
    padding-top: 20px;
  }
  
  .subwallet-modal {
    top: 171px;
    left: 15px;
    right: 15px;
    max-width: 396px;
    padding-bottom: 30px;
  }
`);
