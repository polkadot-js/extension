// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, Logo, ModalContext, QRCode, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { CopySimple, Info } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import styled, { useTheme } from 'styled-components';
import AccountItem from '@subwallet/react-ui/es/web3-block/account-item';
import {
  _getBlockExplorerFromChain,
  _getChainSubstrateAddressPrefix,
  _isEvmChain
} from '@subwallet/extension-base/services/chain-service/utils';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import CopyToClipboard from 'react-copy-to-clipboard';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import { getScanExplorerAddressInfoUrl } from '@subwallet/extension-koni-ui/util';

interface Props extends ThemeProps {
  address?: string;
  selectedNetwork?: string;
}

const modalId = RECEIVE_QR_MODAL;

const Component: React.FC<Props> = ({ address, className, selectedNetwork }: Props) => {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const { inactiveModal } = useContext(ModalContext);
  const notify = useNotification();
  const chainInfo = useFetchChainInfo(selectedNetwork || '');
  const formattedAddress = useMemo(() => {
    if (chainInfo) {
      const isEvmChain = _isEvmChain(chainInfo);
      const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);
      return reformatAddress(address || '', networkPrefix, isEvmChain);
    } else {
      return address || ''
    }

  }, [address, chainInfo]);
  const scanExplorerAddressUrl = useMemo(() => {
    let route = '';
    const blockExplorer = selectedNetwork && _getBlockExplorerFromChain(chainInfo);
    if (blockExplorer && blockExplorer.includes('subscan.io')) {
      route = 'account';
    } else {
      route = 'address';
    }
    if (blockExplorer) {
      return `${blockExplorer}${route}/${formattedAddress}`;
    } else {
      return getScanExplorerAddressInfoUrl(selectedNetwork || '', formattedAddress);
    }
  }, [selectedNetwork, formattedAddress, chainInfo]);

  const handleClickViewOnExplorer = useCallback(() => {
    try {
     if (scanExplorerAddressUrl) {
       void chrome.tabs.create({ url: scanExplorerAddressUrl, active: true }).then(() => console.log('redirecting'));
     }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [scanExplorerAddressUrl]);

  const onCancel = useCallback(() => {
    inactiveModal(modalId);
  }, [inactiveModal]);

  return (
    <SwModal
      className={CN(className)}
      id={modalId}
      onCancel={onCancel}
      rightIconProps={{
        icon: (
          <Icon
            phosphorIcon={Info}
            size='sm'
          />
        )
      }}
      title={t<string>('Your QR code')}
    >
      <>
        <div className='receive-qr-code-wrapper'>
          <QRCode value={formattedAddress} size={264} errorLevel='H' />
        </div>

        <AccountItem
          className={'receive-account-item'}
          addressPreLength={7}
          addressSufLength={7}
          leftItem={
            <Logo network={chainInfo?.slug}  size={24} />
          }
          rightItem={
            <CopyToClipboard text={formattedAddress}>
              <Button
                onClick={() => notify({ message: t('Copied to clipboard')})}
                size='xs'
                className='__copy-button'
                type='ghost'
                icon={<Icon phosphorIcon={CopySimple} size='sm' iconColor={token.colorTextLight4} />}
              />
            </CopyToClipboard>
          }
          address={formattedAddress}
          avatarIdentPrefix={42}
        />

        <Button disabled={!scanExplorerAddressUrl} block onClick={handleClickViewOnExplorer}>{t('View on explorer')}</Button>
      </>
    </SwModal>
  );
};

const ReceiveQrModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.items-container': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.disabled': {
      opacity: 0.4,

      '.ant-web3-block': {
        cursor: 'not-allowed',

        '&:hover': {
          backgroundColor: token['gray-1']
        }
      }
    },

    '.receive-account-item': {
      position: 'relative',
      marginTop: 16,
      marginBottom: 16,

      '.ant-account-item-address': {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          color: token.colorTextLight4,
          fontWeight: token.bodyFontWeight,
      }
    },

    '.__copy-button': {
      position: 'absolute',
      right: 4
    },

    '.receive-qr-code-wrapper': {
      display: 'flex',
      paddingTop: 16,
      flex: 1,
      justifyContent: 'center',
    }
  };
});

export default ReceiveQrModal;
