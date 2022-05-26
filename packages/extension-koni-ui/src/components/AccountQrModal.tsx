// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import Link from '@subwallet/extension-koni-ui/components/Link';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import useScanExplorerAddressUrl from '@subwallet/extension-koni-ui/hooks/screen/home/useScanExplorerAddressUrl';
import useSupportScanExplorer from '@subwallet/extension-koni-ui/hooks/screen/home/useSupportScanExplorer';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { editAccount } from '@subwallet/extension-koni-ui/messaging';
import HeaderEditName from '@subwallet/extension-koni-ui/partials/HeaderEditName';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByNetworkKey, toShort } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import React, { useCallback, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

import cloneLogo from '../assets/clone.svg';
import pencil from '../assets/pencil.svg';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  accountName: string | undefined;
  address: string;
  networkPrefix: number;
  networkKey: string;
  iconTheme: string;
  showExportButton: boolean
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

function AccountQrModal ({ accountName, address, className,
  closeModal,
  iconTheme,
  networkKey,
  networkPrefix,
  showExportButton }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const [editedName, setName] = useState<string | undefined | null>(accountName);
  const [{ isEditing }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const networkMap = useSelector((state: RootState) => state.networkMap);
  const formatted = useMemo(() => {
    const networkInfo = networkMap[networkKey];

    return reformatAddress(address, networkPrefix, networkInfo?.isEthereum);
  }, [networkMap, networkKey, address, networkPrefix]);
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);
  const scanExplorerAddressUrl = useScanExplorerAddressUrl(networkKey, formatted);

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
              <img
                alt='edit'
                src={pencil}
              />
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

          {showExportButton && (
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
    border: 1px solid #fff;
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
`);
