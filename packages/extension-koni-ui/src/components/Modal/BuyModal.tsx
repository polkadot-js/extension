// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faCircleQuestion } from '@fortawesome/free-regular-svg-icons';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { NETWORK_STATUS } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_NETWORK_KEY } from '@subwallet/extension-koni-base/constants';
import signalSlashIcon from '@subwallet/extension-koni-ui/assets/signal-stream-slash-solid.svg';
import signalIcon from '@subwallet/extension-koni-ui/assets/signal-stream-solid.svg';
import { AccountInfoEl } from '@subwallet/extension-koni-ui/components';
import TransakArea from '@subwallet/extension-koni-ui/components/BuyArea/TransakArea';
import InputFilter from '@subwallet/extension-koni-ui/components/InputFilter';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import Tooltip from '@subwallet/extension-koni-ui/components/Tooltip';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import useGenesisHashOptions, { NetworkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalQrProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getGenesisOptionsByAddressType, isAccountAll } from '@subwallet/extension-koni-ui/util';
import { getLogoByGenesisHash } from '@subwallet/extension-koni-ui/util/logoByGenesisHashMap';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  modalQrProp: ModalQrProps;
  updateModalQr: (value: Partial<ModalQrProps>) => void;
}

interface WrapperProps {
  children?: JSX.Element;
  closeModal?: () => void;
  className?: string;
  closeable?: boolean;
}

const Wrapper = (props: WrapperProps) => {
  const { children, className, closeModal, closeable = true } = props;

  return (
    <Modal
      className={CN(className, 'modal-container')}
      maskClosable={closeable}
      onClose={closeModal}
      wrapperClassName={'select-modal'}
    >
      <div className={'buy-modal'}>
        {children}
      </div>
    </Modal>
  );
};

const BuyModal = (props: Props) => {
  const { className, closeModal, modalQrProp, updateModalQr } = props;
  const { account: accountQr, network: networkQr } = modalQrProp;

  const { t } = useTranslation();

  const { accounts } = useContext(AccountContext);

  const account = useMemo((): AccountJson | undefined => {
    return accounts.find((acc) => acc.address === accountQr?.address);
  }, [accounts, accountQr?.address]);

  const genesisOptions = getGenesisOptionsByAddressType(account?.address, accounts, useGenesisHashOptions());

  const network = useMemo((): NetworkSelectOption | undefined => {
    return genesisOptions.find((net) => net.networkKey === networkQr?.networkKey);
  }, [genesisOptions, networkQr?.networkKey]);

  const { address } = (account as AccountJson);
  const { networkKey, networkPrefix } = (network as NetworkSelectOption);

  const networkMap = useSelector((state: RootState) => state.networkMap);
  const formatted = useMemo(() => {
    const networkInfo = networkMap[networkKey];

    return reformatAddress(address, networkPrefix, networkInfo?.isEthereum);
  }, [networkMap, networkKey, address, networkPrefix]);

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
      return <img
        alt='network-status'
        className={'network-status network-status-icon'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
        src={signalIcon}
      />;
    } else {
      return <img
        alt='network-status'
        className={'network-status network-status-icon'}
        data-for={`network-status-icon-${index}`}
        data-tip={true}
        src={signalSlashIcon}
      />;
    }
  }, []);

  const handleStatusText = useCallback((apiStatus: NETWORK_STATUS) => {
    if (apiStatus === NETWORK_STATUS.CONNECTED) {
      return 'Connected';
    } else {
      return 'Unable to connect';
    }
  }, []);

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
        closeable={false}
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
    <Wrapper
      className={CN(className)}
      closeModal={closeModal}
      closeable={false}
    >
      <div className={'buy-modal'}>
        <div className='buy-modal__header'>
          <FontAwesomeIcon
            className='buy-modal__icon'
            // @ts-ignore
            icon={faTimes}
            onClick={closeModal}
          />
        </div>
        <div className='buy-modal__content'>
          <div className={CN('modal-header')}>
            <div className={CN('header-title')}>Select service</div>
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
              text={t<string>('Select the service to obtain the sending address')}
              trigger={'header-icon'}
            />
          </div>
          <div className='modal-body'>
            <TransakArea
              formattedAddress={formatted}
              networkKey={networkKey}
            />
          </div>
        </div>

      </div>
    </Wrapper>
  );
};

export default styled(BuyModal)(({ theme }: ThemeProps) => `
  .buy-modal {
    position: relative;
    display: flex;
    flex-direction: column;
  }

  .buy-modal__header {
    position: absolute;
    top: -5px;
    right: -5px;
    cursor: pointer;
  }

  .buy-modal__icon {
    cursor: pointer;
    color: ${theme.textColor};
  }

  .buy-modal__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
  }

  .buy-modal-button {
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


  .modal-body {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex: 1;
    justify-content: center;
  }

  &.modal-container {

    .select-modal {
      max-width: 390px !important;

      .buy-modal{
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
