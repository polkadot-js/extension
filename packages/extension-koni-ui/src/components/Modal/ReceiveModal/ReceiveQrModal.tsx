// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getChainSubstrateAddressPrefix } from '@subwallet/extension-base/services/chain-service/utils';
import { getExplorerLink } from '@subwallet/extension-base/services/transaction-service/utils';
import InfoIcon from '@subwallet/extension-koni-ui/components/Icon/InfoIcon';
import { RECEIVE_QR_MODAL } from '@subwallet/extension-koni-ui/constants/modal';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useFetchChainInfo from '@subwallet/extension-koni-ui/hooks/screen/common/useFetchChainInfo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import reformatAddress from '@subwallet/extension-koni-ui/utils/account/reformatAddress';
import { Button, Icon, Logo, ModalContext, SwModal, SwQRCode } from '@subwallet/react-ui';
import AccountItem from '@subwallet/react-ui/es/web3-block/account-item';
import CN from 'classnames';
import { ArrowSquareOut, CaretLeft, CopySimple } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import styled from 'styled-components';

interface Props extends ThemeProps {
  address?: string;
  selectedNetwork?: string;
}

const modalId = RECEIVE_QR_MODAL;

const Component: React.FC<Props> = ({ address, className, selectedNetwork }: Props) => {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const notify = useNotification();
  const chainInfo = useFetchChainInfo(selectedNetwork || '');

  const isEvmChain = useMemo(() => {
    if (chainInfo) {
      return !!chainInfo.evmInfo;
    } else {
      return false;
    }
  }, [chainInfo]);

  const formattedAddress = useMemo(() => { // TODO: add zkAddress here
    if (chainInfo) {
      const isEvmChain = !!chainInfo.evmInfo;
      const networkPrefix = _getChainSubstrateAddressPrefix(chainInfo);

      return reformatAddress(address || '', networkPrefix, isEvmChain);
    } else {
      return address || '';
    }
  }, [address, chainInfo]);

  const scanExplorerAddressUrl = useMemo(() => {
    return getExplorerLink(chainInfo, formattedAddress, 'account');
  }, [formattedAddress, chainInfo]);

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
      closeIcon={
        <Icon
          phosphorIcon={CaretLeft}
          size='md'
        />
      }
      id={modalId}
      onCancel={onCancel}
      rightIconProps={{
        icon: <InfoIcon />
      }}
      title={t<string>('Your address')}
    >
      <>
        <div className='receive-qr-code-wrapper'>
          <SwQRCode
            color='#000'
            errorLevel='H'
            logoPadding={isEvmChain ? 6 : 7 }
            size={264}
            value={formattedAddress}
          />
        </div>

        <div className={'receive-account-item-wrapper'}>
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
                  icon={
                    <Icon
                      phosphorIcon={CopySimple}
                      size='sm'
                    />
                  }
                  onClick={onClickCopyBtn}
                  size='xs'
                  tooltip={t('Copy address')}
                  type='ghost'
                />
              </CopyToClipboard>
            }
          />
        </div>

        <Button
          block
          className={'__view-on-explorer'}
          disabled={!scanExplorerAddressUrl}
          icon={
            <Icon
              customSize={'28px'}
              phosphorIcon={ArrowSquareOut}
              size='sm'
              weight={'fill'}
            />
          }
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

    '.ant-web3-block-middle-item': {
      width: 'auto'
    },

    '.__view-on-explorer': {
      fontSize: token.fontSizeLG
    },

    '.ant-account-item': {
      backgroundColor: token.colorBgSecondary
    },

    '.receive-account-item-wrapper': {
      display: 'flex',
      marginTop: token.margin,
      marginBottom: token.margin,
      justifyContent: 'center'
    },

    '.receive-account-item': {
      position: 'relative',
      paddingTop: token.paddingXXS,
      paddingBottom: token.paddingXXS,

      '.ant-account-item-address': {
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        color: token.colorTextLight4,
        fontWeight: token.bodyFontWeight,
        paddingRight: token.paddingXS
      }
    },

    '.receive-qr-code-wrapper': {
      display: 'flex',
      paddingTop: 16,
      flex: 1,
      justifyContent: 'center'
    },

    '.__copy-button': {
      color: token.colorTextLight3,

      '&:hover': {
        color: token.colorTextLight2
      }
    }
  };
});

export default ReceiveQrModal;
