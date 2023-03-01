// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getBlockExplorerFromChain, _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useGetChainInfo';
import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getScanExplorerAddressInfoUrl } from '@subwallet/extension-koni-ui/util';
import reformatAddress from '@subwallet/extension-koni-ui/util/reformatAddress';
import { Button, Icon, Logo, ModalContext, QRCode, SwModal } from '@subwallet/react-ui';
import AccountItem from '@subwallet/react-ui/es/web3-block/account-item';
import CN from 'classnames';
import { CopySimple, Info } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled, { useTheme } from 'styled-components';

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
      const isEvmChain = !!chainInfo.evmInfo;
      const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);

      return reformatAddress(address || '', networkPrefix, isEvmChain);
    } else {
      return address || '';
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
        // eslint-disable-next-line no-void
        void chrome.tabs.create({ url: scanExplorerAddressUrl, active: true }).then(() => console.log('redirecting'));
      }
    } catch (e) {
      console.log('error redirecting to a new tab');
    }
  }, [scanExplorerAddressUrl]);

  const onClickCopyBtn = useCallback(() => notify({ message: t('Copied to clipboard') }), [notify, t]);

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
          <QRCode
            errorLevel='H'
            size={264}
            value={formattedAddress}
          />
        </div>

        <AccountItem
          address={formattedAddress}
          addressPreLength={7}
          addressSufLength={7}
          avatarIdentPrefix={42}
          className={'receive-account-item'}
          leftItem={
            <Logo
              network={chainInfo?.slug}
              size={24}
            />
          }
          rightItem={
            <CopyToClipboard text={formattedAddress}>
              <Button
                className='__copy-button'
                icon={<Icon
                  iconColor={token.colorTextLight4}
                  phosphorIcon={CopySimple}
                  size='sm'
                />}
                onClick={onClickCopyBtn}
                size='xs'
                type='ghost'
              />
            </CopyToClipboard>
          }
        />

        <Button
          block
          disabled={!scanExplorerAddressUrl}
          onClick={handleClickViewOnExplorer}
        >{t('View on explorer')}</Button>
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
        fontWeight: token.bodyFontWeight
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
      justifyContent: 'center'
    }
  };
});

export default ReceiveQrModal;
