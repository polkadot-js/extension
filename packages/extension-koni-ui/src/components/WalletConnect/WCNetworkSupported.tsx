// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfoWithStatus } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import GeneralEmptyList from '../GeneralEmptyList';
import WCNetworkInput from './WCNetworkInput';
import WCNetworkItem from './WCNetworkItem';

interface Props extends ThemeProps {
  id: string;
  networks: WalletConnectChainInfoWithStatus[];
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, id, networks } = props;

  const { t } = useTranslation();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const onOpenModal = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  const onCloseModal = useCallback(() => {
    inactiveModal(id);
  }, [inactiveModal, id]);

  const renderItem = useCallback((item: WalletConnectChainInfoWithStatus) => {
    return (
      <WCNetworkItem
        item={item}
        key={item.slug}
      />
    );
  }, []);

  const renderEmpty = useCallback(() => {
    return (
      <GeneralEmptyList />
    );
  }, []);

  const networkNumber = networks.length;

  return (
    <div className={CN(className)}>
      <WCNetworkInput
        content={t('{{number}} networks support', { replace: { number: networkNumber } })}
        networks={networks}
        onClick={onOpenModal}
      />

      <SwModal
        className={CN(className, 'network-modal')}
        id={id}
        onCancel={onCloseModal}
        title={t('Supported networks')}
      >
        <>
          <div className='modal-sub-content'>{t('{{number}} networks support', { replace: { number: networkNumber } })}</div>
          <SwList.Section
            className='network-list'
            displayRow
            list={networks}
            renderItem={renderItem}
            renderWhenEmpty={renderEmpty}
            rowGap='var(--row-gap)'
          />
        </>

      </SwModal>
    </div>
  );
};

const WCNetworkSupported = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '--icon-color': token['gray-5'],

    '.wc-network-input': {
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG,

      '&:hover': {
        backgroundColor: token.colorBgInput
      }
    },

    '.wc-network-modal-content': {
      textAlign: 'left'
    },

    '.more-icon': {
      display: 'flex',
      width: 40,
      justifyContent: 'center'
    },

    '&.network-modal': {
      '--row-gap': token.sizeXS,
      '.ant-sw-modal-body': {
        padding: `${token.padding}px 0 ${token.padding}px`,
        flexDirection: 'column',
        display: 'flex'
      },

      '.ant-sw-list-wrapper': {
        flexBasis: 'auto'
      },

      '.modal-sub-content': {
        padding: `0 ${token.padding}px`,
        marginBottom: token.marginXS,
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading6,
        lineHeight: token.lineHeightHeading6
      }
    }
  };
});

export default WCNetworkSupported;
