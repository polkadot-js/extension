// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stripUrl } from '@subwallet/extension-base/utils';
import { ConnectionItem, EmptyList, Layout, PageWrapper, WalletConnect } from '@subwallet/extension-koni-ui/components';
import { BaseModal } from '@subwallet/extension-koni-ui/components/Modal/BaseModal';
import { WALLET_CONNECT_LIST_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, SwList } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { GlobeHemisphereWest } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps & {
  isModal?: boolean;
  modalProps?: {
    closeIcon?: SwModalProps['closeIcon'],
    onCancel?: SwModalProps['onCancel'],
  };
  onClickItem?: (topic: string) => void,
  onAdd?: () => void
};

const Component: React.FC<Props> = (props: Props) => {
  const { className, isModal,
    modalProps,
    onAdd: onAddProp, onClickItem: onClickItemProp } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);

  const { sessions } = useSelector((state) => state.walletConnect);

  const items = useMemo(() => Object.values(sessions), [sessions]);

  const goBack = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  const _onClickItem = useCallback((topic: string) => {
    navigate(`/wallet-connect/detail/${topic}`);
  }, [navigate]);

  const onClickItem = onClickItemProp || _onClickItem;

  const renderItem = useCallback((session: SessionTypes.Struct): React.ReactNode => {
    return (
      <ConnectionItem
        key={session.topic}
        onClick={onClickItem}
        session={session}
      />
    );
  }, [onClickItem]);

  const _onAdd = useCallback(() => {
    navigate('/wallet-connect/connect');
  }, [navigate]);

  const onAdd = onAddProp || _onAdd;

  const renderEmptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your dApps will show up here')}
        emptyTitle={t('No dApps found')}
        phosphorIcon={GlobeHemisphereWest}
      />
    );
  }, [t]);

  const searchFunc = useCallback((item: SessionTypes.Struct, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const metadata = item.peer.metadata;
    let id: string;

    try {
      id = stripUrl(metadata.url);
    } catch (e) {
      id = metadata.url;
    }

    const name = metadata.name;

    return (
      id.toLowerCase().includes(searchTextLowerCase) ||
      name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  if (isModal) {
    return (
      <BaseModal
        {...modalProps}
        className={CN(className, '-modal')}
        id={WALLET_CONNECT_LIST_MODAL}
        title={t('WalletConnect')}
      >
        <PageWrapper
          className={'__modal-content'}
          resolve={dataContext.awaitStores(['walletConnect'])}
        >
          <SwList.Section
            className='sessions-list'
            displayRow={true}
            enableSearchInput
            list={items}
            renderItem={renderItem}
            renderWhenEmpty={renderEmptyList}
            rowGap='var(--row-gap)'
            searchFunction={searchFunc}
            searchMinCharactersCount={2}
            searchPlaceholder={t<string>('Search or enter a website')}
          />
        </PageWrapper>

        <div className='__footer'>
          <Button
            block={true}
            icon={
              <Icon
                customIcon={(
                  <WalletConnect
                    height='1em'
                    width='1em'
                  />
                )}
                type='customIcon'
              />
            }
            onClick={onAdd}
          >
            {t('New connection')}
          </Button>
        </div>
      </BaseModal>
    );
  }

  return (
    <Layout.WithSubHeaderOnly
      className={'setting-pages'}
      onBack={goBack}
      rightFooterButton={{
        children: t('New connection'),
        onClick: onAdd,
        icon: (
          <Icon
            customIcon={(
              <WalletConnect
                height='1em'
                width='1em'
              />
            )}
            type='customIcon'
          />
        )
      }}
      title={t('WalletConnect')}
    >
      <PageWrapper
        className={CN(className, '-layout-container')}
        resolve={dataContext.awaitStores(['walletConnect'])}
      >
        <SwList.Section
          className='sessions-list'
          displayRow={true}
          enableSearchInput
          list={items}
          renderItem={renderItem}
          renderWhenEmpty={renderEmptyList}
          rowGap='var(--row-gap)'
          searchFunction={searchFunc}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search or enter a website')}
        />
      </PageWrapper>
    </Layout.WithSubHeaderOnly>
  );
};

const ConnectionList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.-layout-container': {
      padding: token.padding,
      display: 'flex',
      flexDirection: 'column'
    },

    '.sessions-list': {
      '--row-gap': `${token.sizeXS}px`,
      margin: `0 -${token.margin}px`,
      height: '100%',

      '.ant-sw-list': {
        height: '100%'
      },

      '&.ant-sw-list-section .ant-sw-list-wrapper': {
        flexBasis: 300
      }
    },

    '.connection-item.connection-item.connection-item': {
      flex: '0 0 auto'
    },

    '&.-modal': {
      '.ant-sw-modal-body': {
        display: 'flex',
        flexDirection: 'column'
      },

      '.__modal-content': {
        overflow: 'hidden',
        minHeight: 330
      },

      '.sessions-list.ant-sw-list-section .ant-sw-list-wrapper': {
        flexBasis: 'auto'
      },

      '.__footer': {
        paddingTop: token.padding
      }
    }
  };
});

export default ConnectionList;
