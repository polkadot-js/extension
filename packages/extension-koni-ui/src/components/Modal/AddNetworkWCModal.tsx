// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ADD_NETWORK_WALLET_CONNECT_MODAL } from '@subwallet/extension-koni-ui/constants';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, ModalContext, PageIcon, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import { PlugsConnected } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  cancelRequest: () => void;
  networkToAdd: string[];
  requestId: string;
}

const AddNetworkWCModalId = ADD_NETWORK_WALLET_CONNECT_MODAL;
const AddNetworkUrl = '/settings/chains/import';

function Component ({ cancelRequest, className, networkToAdd, requestId }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const onCancel = useCallback(() => {
    inactiveModal(AddNetworkWCModalId);
    cancelRequest();
  }, [cancelRequest, inactiveModal]);

  const addNetwork = useCallback(() => {
    inactiveModal(AddNetworkWCModalId);
    navigate(AddNetworkUrl, { state: { useGoHome: true, chainId: networkToAdd, id: requestId } });
  }, [inactiveModal, navigate, networkToAdd, requestId]);

  const footerModal = useMemo(() => {
    return (
      <>
        <Button
          block={true}
          onClick={onCancel}
          schema={'secondary'}
        >
          {t('Cancel')}
        </Button>

        <Button
          block={true}
          onClick={addNetwork}
        >
          {t('Add network')}
        </Button>
      </>
    );
  }, [onCancel, addNetwork, t]);

  return (
    <>
      <SwModal
        className={CN(className)}
        closable={true}
        footer={footerModal}
        id={AddNetworkWCModalId}
        maskClosable={false}
        onCancel={onCancel}
        title={t('Add network to connect')}
      >
        <div className={'__modal-content'}>
          <PageIcon
            color={token['colorWarning-6']}
            iconProps={{
              weight: 'fill',
              phosphorIcon: PlugsConnected
            }}
          />
          <div className='__modal-description'>
            {t(' The network you\'re connecting to is not yet supported on SubWallet. Add the network first, then connect with WalletConnect again.')}
          </div>
        </div>
      </SwModal>
    </>
  );
}

const AddNetworkWCModal = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.__modal-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size,
      alignItems: 'center',
      padding: `${token.padding}px ${token.padding}px 0 ${token.padding}px`
    },

    '.ant-sw-header-center-part': {
      width: 'fit-content'
    },

    '.__modal-description': {
      textAlign: 'center',
      color: token.colorTextDescription,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.__modal-user-guide': {
      marginLeft: token.marginXXS
    },

    '.ant-sw-modal-footer': {
      borderTop: 'none',
      display: 'flex',
      gap: token.sizeSM
    }
  };
});

export default AddNetworkWCModal;
