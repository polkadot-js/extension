// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import NETWORKS from '@subwallet/extension-koni-base/api/endpoints';
import Identicon from '@subwallet/extension-koni-ui/components/Identicon';
import Modal from '@subwallet/extension-koni-ui/components/Modal';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByNetworkKey, toShort } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import React, { useCallback, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import styled from 'styled-components';

import { IconTheme } from '@polkadot/react-identicon/types';

import cloneLogo from '../assets/clone.svg';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  accountName: string | undefined;
  publicKey: string | undefined | null;
  address: string;
  networkPrefix: number;
  networkKey: string;
  iconTheme: string;
}

function ExportAccountQrModal ({ accountName, address, className,
  closeModal,
  iconTheme,
  networkKey,
  networkPrefix,
  publicKey }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const qrData = useMemo(() => {
    const networkInfo = NETWORKS[networkKey];
    const isEthereum = networkInfo?.isEthereum;
    const formattedAddress = reformatAddress(address, networkPrefix, isEthereum);
    const accountType = isEthereum ? 'ethereum' : 'substrate';
    const result: string[] = [accountType];

    if (isEthereum) {
      result.push(formattedAddress + '@1');
    } else {
      result.push(formattedAddress, publicKey as string);
    }

    if (accountName) {
      result.push(accountName);
    }

    return result.join(':');
  }, [networkKey, address, networkPrefix, accountName, publicKey]);

  const formattedAddress = useMemo(() => {
    const networkInfo = NETWORKS[networkKey];
    const isEthereum = networkInfo?.isEthereum;

    return reformatAddress(address, networkPrefix, isEthereum);
  }, [networkKey, address, networkPrefix]);

  return (
    <Modal className={className}>
      <div className={'export-account-qr-modal'}>
        <div className='export-account-qr-modal__header'>
          <FontAwesomeIcon
            className='export-account-qr-modal__icon'
            // @ts-ignore
            icon={faTimes}
            onClick={closeModal}
          />
        </div>
        <div className='export-account-qr-modal__content'>
          <Identicon
            className='export-account-qr-modal__logo'
            iconTheme={iconTheme as IconTheme}
            prefix={networkPrefix}
            size={54}
            value={formattedAddress}
          />
          <div className='export-account-qr-modal-token-name'>
            <div className='export-account-qr-modal-token-name__text'>
              {accountName}
            </div>
          </div>
          <div className='export-account-qr-modal__qr-code'>
            <QRCode
              size={140}
              value={qrData}
            />
          </div>
          <CopyToClipboard text={formattedAddress || ''}>
            <div
              className='export-account-qr-modal__address'
              onClick={_onCopy}
            >
              <div className='export-account-qr-modal__address-text'>
                <img
                  alt='logo'
                  className={'export-account-qr-modal__network-logo'}
                  src={getLogoByNetworkKey(networkKey)}
                />
                {toShort(formattedAddress, 13, 13)}
                <img
                  alt='clone'
                  className='export-account-qr-modal__clone-logo'
                  src={cloneLogo}
                />
              </div>
            </div>
          </CopyToClipboard>
        </div>
      </div>
    </Modal>
  );
}

export default styled(ExportAccountQrModal)(({ theme }: ThemeProps) => `
  .export-account-qr-modal {
    position: relative;
  }

  .export-account-qr-modal__header {
    position: absolute;
    top: -5px;
    right: -5px;
    cursor: pointer;
  }

  .export-account-qr-modal__icon {
    cursor: pointer;
    color: ${theme.textColor};
  }

  .export-account-qr-modal__content {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .export-account-qr-modal__logo {
    margin-top: 11px;
    width: 58px;
    height: 58px;
  }

  .export-account-qr-modal__network-logo {
    width: 20px;
    height: 20px;
    border: 1px solid #fff;
    border-radius: 50%;
    margin-right: 10px;
    background-color: #fff;
  }

  .export-account-qr-modal-token-name {
    margin-top: 3px;
    display: flex;
    align-items: center;
    position: relative;
  }

  .export-account-qr-modal-token-name__text {
    font-size: 18px;
    line-height: 30px;
    font-weight: 500;
    margin-right: 5px;
    max-width: 200px;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  }

  .export-account-qr-modal__qr-code {
    margin: 20px 0;
    border: 2px solid #fff;
    width: 144px;
    height: 144px;
  }

  .export-account-qr-modal__address {
    border-radius: 8px;
    background-color: ${theme.backgroundAccountAddress};
    width: 100%;
    margin-bottom: 15px;
    cursor: pointer;
  }

  .export-account-qr-modal__address-text {
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

  .export-account-qr-modal__clone-logo {
    padding-left: 10px;
  }

  .export-account-qr-modal-button {
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

  .export-account-qr-modal-button__text {
    font-size: 15px;
    line-height: 26px;
    font-weight: 500;
    color: ${theme.textColor3};
  }

  .export-account-qr-modal-button.-disabled {
    cursor: not-allowed;

    .export-account-qr-modal-button__text {
      opacity: 0.5;
    }
  }

  .export-account-qr-modal__edit-name {
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
