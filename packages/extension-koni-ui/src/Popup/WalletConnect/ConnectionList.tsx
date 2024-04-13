// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stripUrl } from '@subwallet/extension-base/utils';
import { ConnectionItem, EmptyList, Layout, PageWrapper, WalletConnect } from '@subwallet/extension-koni-ui/components';
import { TIME_OUT_RECORD } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { GlobeHemisphereWest } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const timeOutWCMissingKey = 'unsuccessful_connect_wc_modal';
const wcMissingModalId = 'WALLET_CONNECT_CONFIRM_MODAL';

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const dataContext = useContext(DataContext);

  const { sessions } = useSelector((state) => state.walletConnect);

  const items = useMemo(() => Object.values(sessions), [sessions]);
  const { inactiveModal } = useContext(ModalContext);

  useEffect(() => {
    const timeOut = JSON.parse(localStorage.getItem(TIME_OUT_RECORD) || '{}') as Record<string, number>;

    inactiveModal(wcMissingModalId);
    clearTimeout(timeOut[timeOutWCMissingKey]);
    delete timeOut[timeOutWCMissingKey];
    localStorage.setItem(TIME_OUT_RECORD, JSON.stringify(timeOut));
  }, [inactiveModal]);

  const goBack = useCallback(() => {
    navigate('/settings/list');
  }, [navigate]);

  const onClickItem = useCallback((topic: string) => {
    navigate(`/wallet-connect/detail/${topic}`);
  }, [navigate]);

  const renderItem = useCallback((session: SessionTypes.Struct): React.ReactNode => {
    return (
      <ConnectionItem
        key={session.topic}
        onClick={onClickItem}
        session={session}
      />
    );
  }, [onClickItem]);

  const onAdd = useCallback(() => {
    navigate('/wallet-connect/connect');
  }, [navigate]);

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

  return (
    <Layout.WithSubHeaderOnly
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
        className={CN(className)}
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
    padding: token.padding,
    display: 'flex',
    flexDirection: 'column',

    '.sessions-list': {
      '--row-gap': `${token.sizeXS}px`,
      margin: `0 -${token.margin}px`
    }
  };
});

export default ConnectionList;
