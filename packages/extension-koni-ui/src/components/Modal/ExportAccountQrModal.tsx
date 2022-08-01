// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { Button } from '@subwallet/extension-koni-ui/components';
import Modal from '@subwallet/extension-koni-ui/components/Modal/index';
import { AccountContext } from '@subwallet/extension-koni-ui/contexts';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ModalQrProps, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getLogoByNetworkKey, toShort } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import React, { useCallback, useContext, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import cloneLogo from '../../assets/clone.svg';

interface Props extends ThemeProps {
  className?: string;
  closeModal?: () => void;
  modalQrProp: ModalQrProps;
}

function ExportAccountQrModal ({ className,
  closeModal,
  modalQrProp }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { show } = useToast();
  const { networkMap } = useSelector((state: RootState) => state);

  const { accounts } = useContext(AccountContext);

  const { account: accountQr, network: networkQr } = modalQrProp;

  const account = useMemo((): AccountJson | undefined => {
    return accounts.find((acc) => acc.address === accountQr?.address);
  }, [accounts, accountQr?.address]);

  const networkInfo = useMemo((): NetworkJson => {
    return networkMap[networkQr.networkKey];
  }, [networkMap, networkQr.networkKey]);

  const _onCopy = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const qrData = useMemo(() => {
    const isEthereum = networkInfo.isEthereum;
    const formattedAddress = reformatAddress(accountQr.address, networkInfo.ss58Format, isEthereum);
    const genesisHash = networkInfo.genesisHash;
    const accountType = isEthereum ? 'ethereum' : 'substrate';
    const result: string[] = [accountType];

    if (isEthereum) {
      result.push(`${formattedAddress}@${networkInfo.evmChainId || '1'}`);
    } else {
      result.push(formattedAddress, genesisHash);
    }

    if (account?.name) {
      result.push(account.name);
    }

    return result.join(':');
  }, [networkInfo.isEthereum, networkInfo.ss58Format, networkInfo.genesisHash, networkInfo.evmChainId, accountQr.address, account?.name]);

  const formattedAddress = useMemo(() => {
    const isEthereum = networkInfo.isEthereum;
    const networkPrefix = networkInfo.ss58Format;

    return reformatAddress(accountQr.address, networkPrefix, isEthereum);
  }, [networkInfo.isEthereum, networkInfo.ss58Format, accountQr.address]);

  return (
    <Modal className={className}>
      <div className='export-account-qr-modal'>
        <div className='export-account-qr-modal__content'>
          <div className='export-account-qr-modal-token-name'>
            <div className='export-account-qr-modal-token-name__text'>
              {account?.name}
            </div>
          </div>
          <div className='export-account-qr-modal__qr-code'>
            <QRCode
              size={250}
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
                  className='export-account-qr-modal__network-logo'
                  src={getLogoByNetworkKey(networkQr.networkKey)}
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
          <Button
            className='button-close'
            onClick={closeModal}
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default styled(ExportAccountQrModal)(({ theme }: ThemeProps) => `
  .export-account-qr-modal {
    position: relative;
  }

  .export-account-qr-modal__content {
    display: flex;
    flex-direction: column;
    align-items: center;
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
    width: 254px;
    height: 254px;
  }

  .export-account-qr-modal__address {
    border-radius: 8px;
    background-color: ${theme.backgroundAccountAddress};
    width: 100%;
    margin-bottom: 24px;
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

  .button-close {
    width: 170px;
  }
`);
