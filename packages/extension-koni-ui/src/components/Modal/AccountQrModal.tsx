// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NETWORK_STATUS } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY, ALL_NETWORK_KEY } from '@subwallet/extension-koni-base/constants';
import { IconMaps } from '@subwallet/extension-koni-ui/assets/icon';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Link from '@subwallet/extension-koni-ui/components/Link';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import useScanExplorerAddressUrl from '@subwallet/extension-koni-ui/hooks/screen/home/useScanExplorerAddressUrl';
import useSupportScanExplorer from '@subwallet/extension-koni-ui/hooks/screen/home/useSupportScanExplorer';
import useGenesisHashOptions, { NetworkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { editAccount } from '@subwallet/extension-koni-ui/messaging';
import HeaderEditName from '@subwallet/extension-koni-ui/partials/HeaderEditName';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalQrProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getGenesisOptionsByAddressType, getLogoByNetworkKey, isAccountAll, toShort } from '@subwallet/extension-koni-ui/util';
import { getLogoByGenesisHash } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

import cloneLogo from '../../assets/clone.svg';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  modalQrProp: ModalQrProps;
  updateModalQr: (value: Partial<ModalQrProps>) => void;
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

interface WrapperProps {
  children?: JSX.Element;
  closeModal?: () => void;
  className?: string;
}

const Wrapper = (props: WrapperProps) => {
  const { children, className, closeModal } = props;

  return (
    <Modal
      className={CN(className, 'modal-container')}
      maskClosable={true}
      onClose={closeModal}
      wrapperClassName={'select-modal'}
    >
      <div className={'account-qr-modal'}>
        {children}
      </div>
    </Modal>
  );
};

function AccountQrModal (props: Props): React.ReactElement<Props> {
  const { className, closeModal, modalQrProp, updateModalQr } = props;
  const { account: accountQr, network: networkQr, showExportButton } = modalQrProp;

  const { t } = useTranslation();
  const { show } = useToast();

  const { accounts } = useContext(AccountContext);

  const account = useMemo((): AccountJson | undefined => {
    return accounts.find((acc) => acc.address === accountQr?.address);
  }, [accounts, accountQr?.address]);

  const genesisOptions = getGenesisOptionsByAddressType(account?.address, accounts, useGenesisHashOptions());

  const network = useMemo((): NetworkSelectOption | undefined => {
    return genesisOptions.find((net) => net.networkKey === networkQr?.networkKey);
  }, [genesisOptions, networkQr?.networkKey]);

  const { address, isExternal, name: accountName } = (account as AccountJson) || { address: ALL_ACCOUNT_KEY, name: '', isExternal: true };
  const { icon: iconTheme, networkKey, networkPrefix } = (network as NetworkSelectOption) || { networkKey: ALL_NETWORK_KEY, networkPrefix: 42, icon: 'polkadot' };

  const [editedName, setName] = useState<string | undefined | null>(accountName);
  const [{ isEditing }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const formatted = useMemo(() => {
    const networkInfo = networkMap[networkKey];

    return reformatAddress(address, networkPrefix, networkInfo?.isEthereum);
  }, [networkMap, networkKey, address, networkPrefix]);
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);
  const scanExplorerAddressUrl = useScanExplorerAddressUrl(networkKey, formatted);

  const [filter, setFilter] = useState('');

  const filteredAccount = useMemo(() => {
    return accounts.filter((account) => {
      const _network: NetworkSelectOption | null = (network !== undefined && network.networkKey !== ALL_NETWORK_KEY) ? network : null;
      const typeCondition = _network ? (_network.isEthereum ? account.type === 'ethereum' : account.type !== 'ethereum') : true;
      const filterCondition = filter ? account.name?.toLowerCase().includes(filter.toLowerCase()) : true;

      return filterCondition && typeCondition;
    });
  }, [filter, accounts, network]);

  const filteredNetwork = useMemo(() => {
    return filter ? genesisOptions.filter((network) => network.networkKey?.toLowerCase().includes(filter.toLowerCase())) : genesisOptions;
  }, [filter, genesisOptions]);

  const _toggleEdit = useCallback(
    (): void => {
      setEditing(({ toggleActions }) => ({ isEditing: !isEditing, toggleActions: ++toggleActions }));
    },
    [isEditing]
  );

  const _saveChanges = useCallback(
    (): void => {
      editedName && editAccount(address, editedName)
        .catch(console.error);

      _toggleEdit();
    },
    [editedName, address, _toggleEdit]
  );

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const onChangeFilter = useCallback((value: string) => {
    setFilter(value);
  }, []);

  const onChangeAccount = useCallback((address: string) => {
    setFilter('');
    updateModalQr({ account: { address: address } });
  }, [updateModalQr]);

  const onChangeNetwork = useCallback((networkKey: string) => {
    setFilter('');
    updateModalQr({ network: { networkKey: networkKey } });
  }, [updateModalQr]);

  const handleStatusIcon = useCallback((apiStatus: NETWORK_STATUS, index: number) => {
    if (apiStatus === NETWORK_STATUS.CONNECTED) {
      return <div
        className={'network-status network-status-icon network-status-icon-connected'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
      >
        {IconMaps.signal}
      </div>;
    } else {
      return <div
        className={'network-status network-status-icon network-status-icon-disconnected'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
      >
        {IconMaps.signalSplash}
      </div>;
    }
  }, []);

  const handleStatusText = useCallback((apiStatus: NETWORK_STATUS) => {
    if (apiStatus === NETWORK_STATUS.CONNECTED) {
      return 'Connected';
    } else {
      return 'Unable to connect';
    }
  }, []);

  useEffect(() => {
    setName(accountName);
  }, [accountName]);

  useEffect(() => {
    if ((accountQr && !account) || (networkQr && !network)) {
      closeModal && closeModal();
    }
  }, [account, accountQr, closeModal, network, networkQr]);

  if (!accountQr || isAccountAll(accountQr.address)) {
    return (
      <Wrapper
        className={className}
        closeModal={closeModal}
      >
        <>
          <div className={CN('modal-header')}>
            <div className={CN('header-title')}>Account Selection</div>
            <div
              className={CN('header-icon')}
              data-for={'header-icon'}
              data-tip={true}
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
              />
            </div>
            <Tooltip
              text={t<string>('Select the account you would like to send from')}
              trigger={'header-icon'}
            />
          </div>
          <InputFilter
            className={CN('query-input')}
            onChange={onChangeFilter}
            placeholder='Search account...'
            value={filter}
            withReset
          />
          <div className={CN('account-container')}>
            {filteredAccount.map((account, index): React.ReactNode => {
              const { address, genesisHash, name, suri, type } = account;

              const _isAllAccount = isAccountAll(address);

              const onClick = () => {
                onChangeAccount(address);
              };

              if (_isAllAccount) {
                return null;
              }

              return (
                <div
                  className={CN('account-item')}
                  key={index}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={onClick}
                >
                  <AccountInfoEl
                    address={address}
                    className='account__account-item'
                    genesisHash={genesisHash}
                    name={name}
                    showCopyBtn={false}
                    suri={suri}
                    type={type}
                  />
                </div>
              );
            })}
          </div>
        </>
      </Wrapper>
    );
  }

  if (!networkQr || networkQr.networkKey === ALL_NETWORK_KEY) {
    return (
      <Wrapper
        className={className}
        closeModal={closeModal}
      >
        <>
          <div className={CN('modal-header')}>
            <div className={CN('header-title')}>Network Selection</div>
            <div
              className={CN('header-icon')}
              data-for={'header-icon'}
              data-tip={true}
            >
              <FontAwesomeIcon
                icon={faCircleQuestion}
              />
            </div>
            <Tooltip
              text={t<string>('Select the network to obtain the sending address')}
              trigger={'header-icon'}
            />
          </div>
          <InputFilter
            className={CN('query-input')}
            onChange={onChangeFilter}
            placeholder='Search network...'
            value={filter}
            withReset
          />
          <div className={CN('network-container')}>
            {filteredNetwork.map((network, index): React.ReactNode => {
              const { apiStatus, networkKey, text, value } = network;

              const _isAllNetwork = networkKey === ALL_NETWORK_KEY;

              const onClick = () => {
                onChangeNetwork(networkKey);
              };

              if (_isAllNetwork) {
                return null;
              }

              return (
                <div
                  className='network-item-container'
                  key={value}
                  // eslint-disable-next-line react/jsx-no-bind
                  onClick={onClick}
                >
                  <div className={'network-item'}>
                    <img
                      alt='logo'
                      className={'network-logo'}
                      src={getLogoByGenesisHash(value)}
                    />

                    <span className={'network-text'}>{text}</span>
                  </div>
                  <div className={'icon-container'}>
                    { handleStatusIcon(apiStatus, index) }
                    <Tooltip
                      text={handleStatusText(apiStatus)}
                      trigger={`network-status-icon-${index}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      </Wrapper>
    );
  }

  return (
    <Modal className={className}>
      <div className={'account-qr-modal'}>
        <div className='account-qr-modal__header'>
          <FontAwesomeIcon
            className='account-qr-modal__icon'
            // @ts-ignore
            icon={faTimes}
            onClick={closeModal}
          />
        </div>
        <div className='account-qr-modal__content'>
          <Identicon
            className='account-qr-modal__logo'
            iconTheme={iconTheme as IconTheme}
            prefix={networkPrefix}
            size={54}
            value={formatted}
          />
          <div className='account-qr-modal-token-name'>
            <div className='account-qr-modal-token-name__text'>
              {accountName}
            </div>
            <div
              className='account-qr-modal-token-name__edit-btn'
              onClick={_toggleEdit}
            >
              <div className='edit-icon'>
                {IconMaps.pencil}
              </div>
            </div>
            {isEditing && (
              <HeaderEditName
                className='account-qr-modal__edit-name'
                defaultValue={accountName}
                isFocused
                label={' '}
                onBlur={_saveChanges}
                onChange={setName}
              />
            )}
          </div>
          <div className='account-qr-modal__qr-code'>
            <QRCode
              size={140}
              value={formatted}
            />
          </div>
          <CopyToClipboard text={formatted || ''}>
            <div
              className='account-qr-modal__address'
              onClick={_onCopy}
            >
              <div className='account-qr-modal__address-text'>
                <img
                  alt='logo'
                  className={'account-qr-modal__network-logo'}
                  src={getLogoByNetworkKey(networkKey)}
                />
                {toShort(formatted, 13, 13)}
                <img
                  alt='clone'
                  className='account-qr-modal__clone-logo'
                  src={cloneLogo}
                />
              </div>
            </div>
          </CopyToClipboard>

          {isSupportScanExplorer
            ? (
              <a
                className='account-qr-modal-button'
                href={scanExplorerAddressUrl}
                rel='noreferrer'
                target='_blank'
              >
                <div className='account-qr-modal-button__text'>
                  {t<string>('View Account on Explorer')}
                </div>
              </a>
            )
            : (
              <span className='account-qr-modal-button -disabled'>
                <div className='account-qr-modal-button__text'>
                  {t<string>('View Account on Explorer')}
                </div>
              </span>
            )}

          {showExportButton && !isAccountAll(address) && !isExternal && (
            <Link
              className='account-qr-modal-button'
              to={`/account/export/${formatted}`}
            >
              <div className='account-qr-modal-button__text'>
                {t<string>('Export Private Key')}
              </div>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default styled(AccountQrModal)(({ theme }: ThemeProps) => `
  .account-qr-modal {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .account-qr-modal__header {
    position: absolute;
    top: -5px;
    right: -5px;
    cursor: pointer;
  }

  .account-qr-modal__icon {
    cursor: pointer;
    color: ${theme.textColor};
  }

  .account-qr-modal__content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .account-qr-modal__logo {
    margin-top: 11px;
    width: 58px;
    height: 58px;
  }

  .account-qr-modal__network-logo {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    margin-right: 10px;
    background-color: #fff;
  }

  .account-qr-modal-token-name {
    margin-top: 3px;
    display: flex;
    align-items: center;
    position: relative;
  }

  .account-qr-modal-token-name__text {
    font-size: 18px;
    line-height: 30px;
    font-weight: 500;
    margin-right: 5px;
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .account-qr-modal-token-name__edit-btn {
    height: 30px;
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
  }

  .account-qr-modal__qr-code {
    margin: 20px 0;
    border: 2px solid #fff;
    width: 144px;
    height: 144px;

    svg {
      display:block;
    }
  }

  .account-qr-modal__address {
    border-radius: 8px;
    background-color: ${theme.backgroundAccountAddress};
    width: 100%;
    margin-bottom: 15px;
    cursor: pointer;
  }

  .account-qr-modal__address-text {
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    max-width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 11px 43px 11px 43px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .account-qr-modal__clone-logo {
    padding-left: 10px;
  }

  .account-qr-modal-button {
    width: 320px;
    padding: 11px;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: ${theme.buttonBackground1};
    border-radius: 8px;
    margin-bottom: 10px;
    cursor: pointer;
    text-decoration: none;
    opacity: 1;
  }

  .account-qr-modal-button__text {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor3};
  }

  .account-qr-modal-button.-disabled {
    cursor: not-allowed;

    .account-qr-modal-button__text {
      opacity: 0.5;
    }
  }

  .account-qr-modal__edit-name {
    position: absolute;
    flex: 1;
    left: calc(50% - 120px);
    top: -5px;
    width: 240px;
    display: flex;
    align-items: center;
    z-index: 1050;
    > div {
      margin-top: 0;
      width: 100%
    }

    input {
      height: 32px;
    }
  }

  .modal-header {
    display: flex;
    align-items: center;
    justify-content: center;

    .header-title {
      font-weight: 500;
      font-size: 20px;
      line-height: 32px;
    }

    .header-icon {
      color: ${theme.primaryColor};
      margin-left: 4px;
    }
  }

  .query-input {
    margin-top: 12px;
    flex-shrink: 0;
  }

  &.modal-container {

    .select-modal {
      max-width: 390px !important;

      .account-qr-modal{
        height: 450px;
      }
    }
  }

  .account-container {
    flex: 1 1 0%;
    overflow-y: auto;
    margin-top: 10px;
    margin-bottom: 10px;

    .account-item {
      padding: 10px 0;
      position: relative;
      cursor: pointer;

      .account-info-row {
        height: 40px;

        .account-info__name {
          line-height: 20px;
          margin: 0;
        }

        .account-info-full-address {
          line-height: 20px;
          font-size: 12px;
        }
      }

      .account-info-identity-icon {
        padding: 0;
      }
    }
  }
   
  .network-status-icon-connected {
    color: ${theme.primaryColor}
  }
  .network-status-icon-disconnected {
    color: ${theme.iconNeutralColor}
  }
  
  .edit-icon {
    color: ${theme.primaryColor}
    
    svg {
      display: block;
    }
  }

  .network-container {
    flex: 1 1 0%;
    overflow-y: auto;
    margin-top: 15px;
    margin-bottom: 10px;
    padding-right: 10px;

    .network-item-container {
      padding: 5px 0;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .network-item {
        display: flex;
        align-items: center;
      }

      .network-logo {
        min-width: 30px;
        width: 32px;
        height: 32px;
        border-radius: 100%;
        overflow: hidden;
        image-rendering: -webkit-optimize-contrast;
        image-rendering: crisp-edges;
        background: #fff;
        margin-right: 10px;
      }

      .network-text {
        font-weight: 500;
        font-size: 15px;
        line-height: 40px;
        color: ${theme.textColor2};
      }

      &:hover {
        .network-text {
          color: ${theme.textColor};
        }
      }
    }
  }

`);
