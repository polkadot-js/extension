// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList, SwModal } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { GeneralEmptyList } from '../../EmptyList';
import WCNetworkInput from './WCNetworkInput';
import WCNetworkItem from './WCNetworkItem';

interface Props extends ThemeProps {
  id: string;
  contentNetworks: WalletConnectChainInfo[];
  networks: WalletConnectChainInfo[];
  content: string;
  title: string;
  subTitle: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, content, contentNetworks, id, networks, subTitle, title } = props;

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const onOpenModal = useCallback(() => {
    activeModal(id);
  }, [activeModal, id]);

  const onCloseModal = useCallback(() => {
    inactiveModal(id);
  }, [inactiveModal, id]);

  const renderItem = useCallback((item: WalletConnectChainInfo) => {
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

  return (
    <div className={CN(className)}>
      <WCNetworkInput
        content={content}
        networks={contentNetworks}
        onClick={onOpenModal}
      />

      <SwModal
        className={CN(className, 'network-modal')}
        id={id}
        onCancel={onCloseModal}
        title={title}
      >
        <>
          <div className='modal-sub-content'>{subTitle}</div>
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

const WCNetworkBase = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.network-modal': {
      '--row-gap': `${token.sizeXS}px`,
      '.ant-sw-modal-body': {
        padding: `${token.padding}px 0 ${token.padding}px`,
        flexDirection: 'column',
        display: 'flex'
      },

      '.ant-sw-list-wrapper': {
        overflow: 'auto',
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

export default WCNetworkBase;
