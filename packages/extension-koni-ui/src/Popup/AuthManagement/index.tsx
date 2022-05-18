// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import { AuthUrlInfo, AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import ConfirmModal from '@subwallet/extension-koni-ui/components/ConfirmModal';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';

import useTranslation from '../../hooks/useTranslation';
import { changeAuthorization, changeAuthorizationAll, forgetAllSite, getAuthListV2 } from '../../messaging';
import { InputFilter } from './../../components';
import WebsiteEntry from './WebsiteEntry';

interface Props extends ThemeProps {
  className?: string;
}

function AuthManagement ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [authList, setAuthList] = useState<AuthUrls | null>(null);
  const [filter, setFilter] = useState('');
  const [isBusy, setBusy] = useState(false);
  const [isShowConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    getAuthListV2()
      .then(({ list }) => setAuthList(list))
      .catch((e) => console.error(e));
  }, []);

  const closeModal = useCallback(
    () => setShowConfirmModal(false),
    []
  );

  const openForgetConfirmModal = useCallback(
    () => {
      (authList && Object.keys(authList).length !== 0) && setShowConfirmModal(true);
    }, [authList]
  );

  const _onChangeFilter = useCallback((filter: string) => {
    setFilter(filter);
  }, []);

  const changeConnectSite = useCallback((connectValue: boolean, url: string) => {
    changeAuthorization(connectValue, url, (data) => setAuthList(data))
      .catch(console.error);
  }, []);

  const connectAll = useCallback(() => {
    changeAuthorizationAll(true, (data) => {
      setAuthList(data);
    }).catch(console.error);
  }, []);

  const disconnectAll = useCallback(() => {
    changeAuthorizationAll(false, (data) => {
      setAuthList(data);
    }).catch(console.error);
  }, []);

  const onForgetAllSite = useCallback(() => {
    setBusy(true);
    forgetAllSite((data) => {
      setAuthList(data);
      setShowConfirmModal(false);
      setBusy(false);
    }).catch(console.error);
  }, []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        smallMargin
        subHeaderName={t<string>('Manage Website Access')}
        to='/account/settings'
      >
        <div className='auth-management-input-filter'>
          <InputFilter
            onChange={_onChangeFilter}
            placeholder={t<string>('example.com')}
            value={filter}
            withReset
          />
        </div>
      </Header>
      <>
        <div className='auth-management__top-action'>
          <div
            className='auth-management__btn'
            onClick={openForgetConfirmModal}
          >
            {t<string>('Forget All')}
          </div>
          <div
            className='auth-management__btn'
            onClick={disconnectAll}
          >
            {t<string>('Disconnect All')}
          </div>
          <div
            className='auth-management__btn'
            onClick={connectAll}
          >
            {t<string>('Connect All')}
          </div>
        </div>
        <div className='auth-list-wrapper'>
          {
            !authList || !Object.entries(authList)?.length
              ? <div className='empty-list'>{t<string>('No website request yet!')}</div>
              : <>
                <div className='website-list'>
                  {Object.entries(authList)
                    .filter(([url]: [string, AuthUrlInfo]) => url.includes(filter))
                    .map(
                      ([url, info]: [string, AuthUrlInfo]) =>
                        <WebsiteEntry
                          changeConnectSite={changeConnectSite}
                          info={info}
                          key={url}
                          setList={setAuthList}
                          url={url}
                        />
                    )}
                </div>
              </>
          }
        </div>
      </>
      {isShowConfirmModal &&
        <ConfirmModal
          closeModal={closeModal}
          confirmAction={onForgetAllSite}
          confirmButton={'Forget'}
          confirmMessage={'Do you want to forget all sites?'}
          isBusy={isBusy}
        />
      }
    </div>
  );
}

export default styled(AuthManagement)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  height: 100%;

  .auth-list-wrapper {
    margin-bottom: 15px;
    overflow-x: hidden;
  }

  .auth-management__top-action {
    display: flex;
    justify-content: flex-end;
    padding: 10px 15px;
  }

  .auth-management-input-filter {
    padding: 0 15px 12px;
  }

  .website-list {
    width: 460px;
    overflow-y: auto;
    padding: 0 15px;
  }

  .empty-list {
    text-align: center;
    padding-top: 10px;
  }

  .auth-management__btn {
    padding-left: 17px;
    position: relative;
    font-size: 14px;
    line-height: 24px;
    color: ${theme.textColor2};
  }

  .auth-management__btn:hover {
    cursor: pointer;
    color: ${theme.buttonTextColor2};
  }

  .auth-management__btn:not(:first-child):before {
    content: '';
    position: absolute;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: ${theme.textColor2};
    top: 0;
    bottom: 0;
    left: 7px;
    margin: auto 0;
  }

  .subwallet-modal {
    top: 30%;
    left: 70px;
    right: 70px;
    max-width: 320px;
  }
`);
