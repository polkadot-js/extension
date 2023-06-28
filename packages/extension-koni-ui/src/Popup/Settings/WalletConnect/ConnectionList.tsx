// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, ConnectionItem, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import ConnectScanner from '@subwallet/extension-koni-ui/components/WalletConnect/ConnectScanner';
import { ADD_CONNECTION_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useDefaultNavigate, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { PlusCircle } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const dataContext = useContext(DataContext);
  const { activeModal } = useContext(ModalContext);

  const { sessions } = useSelector((state) => state.walletConnect);

  const items = useMemo(() => Object.values(sessions), [sessions]);

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
    activeModal(ADD_CONNECTION_MODAL);
  }, [activeModal]);

  return (
    <Layout.WithSubHeaderOnly
      onBack={goBack}
      rightFooterButton={{
        children: t('Add Connection'),
        onClick: onAdd,
        icon: (
          <Icon
            phosphorIcon={PlusCircle}
          />
        )
      }}
      subHeaderIcons={[{
        icon: <CloseIcon />,
        onClick: goHome
      }]}
      title={t('Connections')}
    >
      <PageWrapper
        className={CN(className)}
        resolve={dataContext.awaitStores(['walletConnect'])}
      >
        <SwList.Section
          className='sessions-list'
          displayRow={true}
          list={items}
          renderItem={renderItem}
          rowGap='var(--row-gap)'
        />
        <ConnectScanner />
      </PageWrapper>
    </Layout.WithSubHeaderOnly>
  );
};

const ConnectionList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.padding,

    '.sessions-list': {
      '--row-gap': token.sizeXS,
      margin: `0 -${token.margin}px`
    }
  };
});

export default ConnectionList;
