// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { IconMaps } from '@subwallet/extension-koni-ui/assets/icon';
import DefaultWebIcon from '@subwallet/extension-koni-ui/assets/icon/web.svg';
import rejectIcon from '@subwallet/extension-koni-ui/assets/reject-icon.svg';
import { AccountContext, AccountInfoEl, Button } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import { useGetCurrentTab } from '@subwallet/extension-koni-ui/hooks/useGetCurrentTab';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { changeAuthorizationBlock, changeAuthorizationPerSite } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { accountCanSign, findAccountByAddress, getSignMode } from '@subwallet/extension-koni-ui/util/account';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps{
  className?: string;
  authInfo?: AuthUrlInfo;
  isNotConnected: boolean;
  isBlocked: boolean;
  onClose: () => void;
  visible: boolean;
}

const AccountVisibleModal = (props: Props) => {
  const { authInfo, className, isBlocked, isNotConnected, onClose, visible } = props;

  const { t } = useTranslation();
  const { show } = useToast();

  const { currentAccount } = useSelector((state: RootState) => state);
  const { accounts } = useContext(AccountContext);

  const [allowedMap, setAllowedMap] = useState<Record<string, boolean>>(authInfo?.isAllowedMap || {});
  const [oldConnected, setOldConnected] = useState(0);
  const [isSubmit, setIsSubmit] = useState(false);

  const currentTab = useGetCurrentTab();
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(DefaultWebIcon);
  const [requestId, setRequestId] = useState('');
  const listRef: React.RefObject<HTMLDivElement> | null = useRef(null);

  const wrapperClassName = useMemo(() => {
    if (isNotConnected || !authInfo) {
      return 'not-connected-modal';
    } else if (isBlocked) {
      return 'blocked-modal';
    } else {
      return 'connection-modal';
    }
  }, [authInfo, isBlocked, isNotConnected]);

  const handlerUpdateMap = useCallback((address: string, oldValue: boolean) => {
    return () => {
      setAllowedMap((values) => ({
        ...values,
        [address]: !oldValue
      }));
    };
  }, []);

  const handlerSubmit = useCallback(() => {
    if (!isSubmit && authInfo?.id) {
      setIsSubmit(true);
      changeAuthorizationPerSite({ values: allowedMap, id: authInfo.id })
        .then(() => {
          show(t('Data has been updated'));
          onClose();
          setIsSubmit(false);
        })
        .catch(console.error);
    }
  }, [allowedMap, authInfo?.id, isSubmit, onClose, show, t]);

  const handlerUnblock = useCallback(() => {
    if (!isSubmit && authInfo?.id) {
      setIsSubmit(true);
      changeAuthorizationBlock({ connectedValue: true, id: authInfo.id })
        .then(() => {
          show(t('Data has been updated'));
          setIsSubmit(false);
        })
        .catch(console.error);
    }
  }, [authInfo?.id, isSubmit, show, t]);

  const renderContent = useCallback(() => {
    if (isNotConnected || !authInfo) {
      return (
        <div className='text-content'>
          SubWallet is not connected to this site. To connect to a web3 site, find and click the connect button.
        </div>
      );
    } else if (isBlocked) {
      return (
        <>
          <Button
            className='authorize-request__btn'
          >
            <img
              alt='Icon'
              src={rejectIcon}
            />
          </Button>
          <div className='text-content'>
            This website has previously been blocked. Do you wish to unblock and grant access to it?
          </div>
        </>
      );
    } else {
      const origin = Object.entries(allowedMap).map(([address, value]) => ({ address, value }));
      const list = origin.filter(({ address }) => accountCanSign(getSignMode(findAccountByAddress(accounts, address))));

      const current = list.find(({ address }) => address === currentAccount.account?.address);

      if (current) {
        const idx = list.indexOf(current);

        list.splice(idx, 1);
        list.unshift(current);
      }

      return (
        <>
          <div className='text-content text-left'>
            You have {oldConnected} accounts connected to this site
          </div>
          <div
            className='accounts-container'
            ref={listRef}
          >
            {
              list.map(({ address, value }) => {
                const account = accounts.find((acc) => acc.address === address);

                if (!account || isAccountAll(account.address)) {
                  return null;
                }

                const isCurrent = account.address === currentAccount.account?.address;

                return (
                  <div
                    className={CN(
                      'account-item-container',
                      {
                        'current-account': isCurrent
                      }
                    )}
                    key={address}
                    onClick={handlerUpdateMap(address, value)}
                  >
                    <div className='account-info'>
                      <AccountInfoEl
                        accountSplitPart='right'
                        address={address}
                        addressHalfLength={5}
                        className='authorize-request__account'
                        iconSize={40}
                        isShowBanner={false}
                        name={account.name}
                        showCopyBtn={false}
                        suri={account.suri}
                        type={account.type}
                      />
                    </div>
                    <div className='account-selection'>
                      {value && (
                        <div className='selected'>
                          {IconMaps.check}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            }
          </div>
        </>
      );
    }
  }, [isNotConnected, authInfo, isBlocked, allowedMap, oldConnected, currentAccount.account?.address, accounts, handlerUpdateMap]);

  const renderAction = useCallback(() => {
    if (isNotConnected || !authInfo) {
      return (
        <Button
          className={CN('button', 'primary-button')}
          onClick={onClose}
        >
          Close
        </Button>
      );
    } else if (isBlocked) {
      return (
        <>
          <Button
            className={CN('button', 'secondary-button')}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className={CN('button', 'primary-button')}
            onClick={handlerUnblock}
          >
            Unblock
          </Button>
        </>
      );
    } else {
      return (
        <>
          <Button
            className={CN('button', 'secondary-button')}
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className={CN('button', 'primary-button')}
            isBusy={isSubmit}
            onClick={handlerSubmit}
          >
            Confirm
          </Button>
        </>
      );
    }
  }, [authInfo, handlerSubmit, handlerUnblock, isBlocked, isNotConnected, isSubmit, onClose]);

  useEffect(() => {
    if (!currentTab) {
      return;
    }

    const { hostname } = new URL(currentTab.url || '');

    setRequestId(hostname);
    setTitle(currentTab.title || '');
    setIcon(currentTab.favIconUrl || DefaultWebIcon);
  }, [currentTab]);

  useEffect(() => {
    if (authInfo?.isAllowedMap && visible) {
      const connected = Object.values(authInfo.isAllowedMap).filter((s) => s).length;

      const type = authInfo.accountAuthType;
      const allowedMap = authInfo.isAllowedMap;

      const filterType = (address: string) => {
        if (type === 'both') {
          return true;
        }

        const _type = type || 'substrate';

        return _type === 'substrate' ? !isEthereumAddress(address) : isEthereumAddress(address);
      };

      const result: Record<string, boolean> = {};

      Object.entries(allowedMap)
        .filter(([address]) => filterType(address))
        .forEach(([address, value]) => {
          result[address] = value;
        });

      setAllowedMap(result);
      setOldConnected(connected);
    } else {
      setOldConnected(0);
      setAllowedMap({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (listRef.current) {
      let interval: NodeJS.Timer | null = null;

      listRef.current.addEventListener('scroll', () => {
        if (!listRef.current?.classList.contains('on-scrollbar')) {
          listRef.current?.classList.add('on-scrollbar');
          interval = setInterval(() => {
            if (interval) {
              clearInterval(interval);
            }

            listRef.current?.classList.remove('on-scrollbar');
          }, 1000);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listRef.current]);

  if (!currentTab || !visible) {
    return null;
  }

  return (
    <Modal
      className={CN(className, 'account-visible-modal-container')}
      wrapperClassName={CN('account-visible-wrapper', wrapperClassName)}
    >
      <div className={'account-visible-modal'}>
        <div className='header-container'>
          <div className='title-container'>
            <img
              alt={`${requestId}-logo`}
              className='web-logo'
              src={icon}
            />
            <div className='title'>
              {title}
            </div>
          </div>
          <div className='request-id'>
            {requestId}
          </div>
        </div>
        <div className='content-container'>
          { renderContent() }
        </div>
        <div className='action-container'>
          { renderAction() }
        </div>
      </div>
    </Modal>
  );
};

export default React.memo(styled(AccountVisibleModal)(({ theme }: Props) => `
  &.account-visible-modal-container {
    .subwallet-modal {
      &.account-visible-wrapper {
        padding: 30px 20px;
        width: 400px;
        max-width: 400px;
        left: 30px;
        right: 30px;
      }

      &.not-connected-modal {
          height: 300px;
        }

      &.blocked-modal {
        height: 345px;
      }

      &.connection-modal {
        height: 450px;
        top: 50px;
      }
    }

    .account-visible-modal {
      .header-container {
        display: flex;
        flex-direction: column;
        align-items: center;

        .title-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          background-color: ${theme.checkboxColor};
          border-radius: 5px;
          max-width: 237px;
          height: 40px;

          .web-logo {
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }

          .title {
            font-style: normal;
            font-weight: 400;
            font-size: 14px;
            line-height: 24px;
            max-width: 185px;
            color: ${theme.textColor2};
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .request-id {
          margin-top: 10px;
          font-style: normal;
          font-weight: 400;
          font-size: 14px;
          line-height: 24px;
          color: ${theme.textColor2};
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 237px;
        }
      }

      .content-container {
        margin-top: 16px;
        display: flex;
        flex-direction: column;

        .text-content {
          font-style: normal;
          font-weight: 500;
          font-size: 15px;
          line-height: 26px;
          color: ${theme.textColor};
          text-align: center;
          padding: 0 10px;

          &.text-left {
            text-align: left;
            padding: 0;
          }
        }

        .authorize-request__btn {
          background-color: ${theme.buttonBackgroundDanger};
          margin-top: 4px;
          margin-bottom: 22px;
          width: fit-content;
          place-self: center;

          .children {
            display: flex;
          }

          span {
            color: ${theme.buttonTextColor};
          }
        }

        .accounts-container {
          margin-top:16px;
          height: 184px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 8px;
          position: relative;
          scrollbar-width: thin; /* Firefox */
          -ms-overflow-style: none; /* IE 10+ */
          -webkit-background-clip: text;
          transition: background-color 0.5s ease-in-out;

          &.on-scrollbar{
            background-color: ${theme.scrollBarThumb};
          }

          &.::-webkit-scrollbar {
            width: 6px !important;
          }

          &::-webkit-scrollbar-thumb {
            background-color: inherit;
          }

          .account-item-container {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: ${theme.accountAuthorizeRequest};
            border-radius: 8px;
            height: 56px;
            cursor: pointer;

            &.current-account {
              border: 1px solid ${theme.primaryColor};
            }

            & > .account-info{
              width: 290px;

              .authorize-request__account {
                overflow: hidden;
              }
            }

            .account-info  {
              position: relative;
              display: flex;
              overflow: hidden;

              .account-info-row {
                height: 56px;
              }

              .account-info-identity-icon {
                border: 0;
                padding: 0;
                margin: 0 10px;

                .icon {
                  height: 40px;
                  width: 40px;

                  img {
                    height: 40px;
                    width: 40px;
                  }
                }
              }

              .account-info__name {
                font-size: 18px;
                max-width: 200px;
                margin-right: 8px;
              }

              .account-info-full-address {
                font-size: 18px;
                font-weight: 600;
                &:before {content: "("}
                &:after {content: ")"}
                white-space: nowrap;
              }
            }

            .account-selection {
              .selected {
                color: ${theme.primaryColor};
                padding-right: 22px;
              }
            }
          }
        }
      }

      .action-container {
        display: flex;
        flex-direction: row;
        gap: 10px;
        align-items: center;
        justify-content: center;
        margin-top: 24px;

        .button {
          width: 173px;
          height: 48px;
          border-radius: 8px;
        }

        .primary-button {
          background: ${theme.secondaryColor};
          color: ${theme.buttonTextColor};
        }

        .secondary-button {
          background: ${theme.buttonBackground1};
          color: ${theme.buttonTextColor2};
        }
      }
    }
  }
`));
