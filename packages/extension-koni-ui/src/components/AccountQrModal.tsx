// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import React, {useCallback, useMemo, useState} from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import styled from 'styled-components';

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import Identicon from '@polkadot/extension-koni-ui/components/Identicon';
import Link from '@polkadot/extension-koni-ui/components/Link';
import Modal from '@polkadot/extension-koni-ui/components/Modal';
import useToast from '@polkadot/extension-koni-ui/hooks/useToast';
import useTranslation from '@polkadot/extension-koni-ui/hooks/useTranslation';
import {editAccount} from '@polkadot/extension-koni-ui/messaging';
import HeaderEditName from '@polkadot/extension-koni-ui/partials/HeaderEditName';
import {ThemeProps} from '@polkadot/extension-koni-ui/types';
import {
  getLogoByNetworkName,
  getScanExplorerAddressInfoUrl,
  isSupportScanExplorer, toShort
} from '@polkadot/extension-koni-ui/util';
import reformatAddress from '@polkadot/extension-koni-ui/util/reformatAddress';
import {IconTheme} from '@polkadot/react-identicon/types';

import cloneLogo from '../assets/clone.svg';
import pencil from '../assets/pencil.svg';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  accountName: string | undefined | null;
  address: string;
  networkPrefix: number;
  networkName: string;
  iconTheme: string;
  showExportButton: boolean
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

function AccountQrModal({
                          accountName, address, className,
                          closeModal,
                          iconTheme,
                          networkName,
                          networkPrefix,
                          showExportButton
                        }: Props): React.ReactElement<Props> {
  const {t} = useTranslation();
  const {show} = useToast();
  const [editedName, setName] = useState<string | undefined | null>(accountName);
  const [{isEditing}, setEditing] = useState<EditState>({isEditing: false, toggleActions: 0});

  const _toggleEdit = useCallback(
    (): void => {
      setEditing(({toggleActions}) => ({isEditing: !isEditing, toggleActions: ++toggleActions}));
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

  const formatted = useMemo(() => {
    const networkInfo = NETWORKS[networkName];

    return reformatAddress(address, networkPrefix, networkInfo?.isEthereum);
  }, [address, networkPrefix, networkName]);

  return (
    <Modal
      className={className}
    >
      <div className='buy-token-container'>
        <div className='buy-token-header'>
          <FontAwesomeIcon
            className='close-modal-btn__icon'
            icon={faTimes}
            onClick={closeModal}
          />
        </div>
        <div className='koni-buy-token-content'>
          <Identicon
            className='koni-buy-token-account-logo'
            iconTheme={iconTheme as IconTheme}
            prefix={networkPrefix}
            size={54}
            value={formatted}
          />
          <div className='koni-buy-token-name'>
            <div className='koni-buy-token-name__text'>
              {accountName}
            </div>
            <div
              className='koni-buy-token-name__edit-btn'
              onClick={_toggleEdit}
            >
              <img
                alt='edit'
                src={pencil}
              />
            </div>
            {isEditing && (
              <HeaderEditName
                address={address}
                className='edit-name'
                isFocused
                label={' '}
                onBlur={_saveChanges}
                onChange={setName}
              />
            )}
          </div>
          <div className='koni-buy-token-qr-code'>
            <QRCode
              size={140}
              value={formatted}
            />
          </div>
          <CopyToClipboard text={formatted || ''}>
            <div
              className='koni-buy-token-address'
              onClick={_onCopy}
            >
              <div className='koni-buy-token-address__text'>
                <img
                  alt='logo'
                  className={'koni-network-logo'}
                  src={getLogoByNetworkName(networkName)}
                />
                {toShort(formatted, 13, 13)}
                <img
                  alt='clone'
                  className='clone-logo'
                  src={cloneLogo}
                />
              </div>
            </div>
          </CopyToClipboard>

          {isSupportScanExplorer(networkName)
            ? (
              <a
                className='koni-buy-token-button'
                href={getScanExplorerAddressInfoUrl(networkName, formatted)}
                rel='noreferrer'
                target='_blank'
              >
                <div className='koni-buy-token-button__text'>
                  {t<string>('View Account on Explorer')}
                </div>
              </a>
            )
            : (
              <span className='koni-buy-token-button -disabled'>
                <div className='koni-buy-token-button__text'>
                  {t<string>('View Account on Explorer')}
                </div>
              </span>
            )}

          {showExportButton && (
            <Link
              className='koni-buy-token-button'
              to={`/account/export/${formatted}`}
            >
              <div className='koni-buy-token-button__text'>
                {t<string>('Export Private Key')}
              </div>
            </Link>
          )}
        </div>
      </div>
    </Modal>
  );
}

export default styled(AccountQrModal)(({theme}: ThemeProps) => `
  .koni-modal {
    max-width: 460px;
  }

  .buy-token-container {
    position: relative;
  }
  .buy-token-header {
    position: absolute;
    top: -5px;
    right: -5px;
    cursor: pointer;
  }

  .close-modal-btn {
    cursor: pointer;

    &__icon {
      color: ${theme.textColor};
    }
  }

  .koni-buy-token-content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .koni-buy-token-account-logo {
    margin-top: 11px;
    width: 58px;
    height: 58px;
  }

  .koni-network-logo {
    width: 20px;
    height: 20px;
    border: 1px solid #fff;
    border-radius: 50%;
    margin-right: 10px;
    background-color: #fff;
  }

  .koni-buy-token-name {
    margin-top: 3px;
    display: flex;
    align-items: center;
    position: relative;

    &__text {
      font-size: 18px;
      line-height: 30px;
      font-weight: 500;
      margin-right: 5px;
      max-width: 200px;
      text-overflow: ellipsis;
      overflow: hidden;
      white-space: nowrap;
    }

    &__edit-btn {
      height: 30px;
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
    }
  }

  .koni-buy-token-qr-code {
    margin: 20px 0;
    border: 2px solid #fff;
  }

  .koni-buy-token-address {
    border-radius: 8px;
    background-color: ${theme.backgroundAccountAddress};
    width: 100%;
    margin-bottom: 15px;
    cursor: pointer;

    &__text {
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
  }

  .clone-logo {
    padding-left: 10px;
  }

  .koni-buy-token-button {
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

    &__text {
      font-size: 16px;
      line-height: 26px;
      font-weight: 500;
      color: ${theme.textColor3};
    }
  }

  .koni-buy-token-button.-disabled {
    cursor: not-allowed;

    .koni-buy-token-button__text {
      opacity: 0.5;
    }
  }

  .edit-name {
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
