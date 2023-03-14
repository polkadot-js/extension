// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { ActionItemType, ActionModal } from '@subwallet/extension-koni-ui/components/Modal/ActionModal';
import { WebsiteAccessItem } from '@subwallet/extension-koni-ui/components/Setting/WebsiteAccessItem';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { changeAuthorizationAll, forgetAllSite } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { updateAuthUrls } from '@subwallet/extension-koni-ui/stores/utils';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ManageWebsiteAccessDetailParam } from '@subwallet/extension-koni-ui/types/navigation';
import { Icon, SwList, SwSubHeader } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { GearSix, GlobeHemisphereWest, Plugs, PlugsConnected, X } from 'phosphor-react';
import React, { useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const ActionModalId = 'actionModalId';
// const FilterModalId = 'filterModalId';

function getWebsiteItems (authUrlMap: Record<string, AuthUrlInfo>): AuthUrlInfo[] {
  return Object.values(authUrlMap);
}

function getAccountCount (item: AuthUrlInfo): number {
  return Object.values(item.isAllowedMap).filter((i) => i).length;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const authUrlMap = useSelector((state: RootState) => state.settings.authUrls);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useDefaultNavigate().goBack;
  const { token } = useTheme() as Theme;

  const websiteAccessItems = useMemo<AuthUrlInfo[]>(() => {
    return getWebsiteItems(authUrlMap);
  }, [authUrlMap]);

  const onOpenActionModal = useCallback(() => {
    activeModal(ActionModalId);
  }, [activeModal]);

  const onCloseActionModal = useCallback(() => {
    inactiveModal(ActionModalId);
  }, [inactiveModal]);

  const actions: ActionItemType[] = useMemo(() => {
    return [
      {
        key: 'forget-all',
        icon: X,
        iconBackgroundColor: token.colorWarning,
        title: t('Forget all'),
        onClick: () => {
          forgetAllSite(updateAuthUrls).catch(console.error);
          onCloseActionModal();
        }
      },
      {
        key: 'disconnect-all',
        icon: Plugs,
        iconBackgroundColor: token['gray-3'],
        title: t('Disconnect all'),
        onClick: () => {
          changeAuthorizationAll(false, updateAuthUrls).catch(console.error);
          onCloseActionModal();
        }
      },
      {
        key: 'connect-all',
        icon: PlugsConnected,
        iconBackgroundColor: token['green-6'],
        title: t('Connect all'),
        onClick: () => {
          changeAuthorizationAll(true, updateAuthUrls).catch(console.error);
          onCloseActionModal();
        }
      }
    ];
  }, [onCloseActionModal, t, token]);

  const onClickItem = useCallback((item: AuthUrlInfo) => {
    return () => {
      navigate('/settings/dapp-access-edit', { state: {
        siteName: item.origin,
        origin: item.id,
        accountAuthType: item.accountAuthType || ''
      } as ManageWebsiteAccessDetailParam });
    };
  }, [navigate]);

  const renderItem = useCallback(
    (item: AuthUrlInfo) => {
      return (
        <div key={item.id}>
          <WebsiteAccessItem
            accountCount={getAccountCount(item)}
            domain={item.id}
            onClick={onClickItem(item)}
            siteName={item.origin || item.id}
          />
        </div>
      );
    },
    [onClickItem]
  );

  const renderEmptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your list of approved dApps will appear here.')}
        emptyTitle={t('No dApps found')}
        phosphorIcon={GlobeHemisphereWest}
      />
    );
  }, [t]);

  const searchFunc = useCallback((item: AuthUrlInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.origin.toLowerCase().includes(searchTextLowerCase) ||
      item.id.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  return (
    <PageWrapper className={`manage-website-access ${className}`}>
      <SwSubHeader
        background={'transparent'}
        center
        onBack={goBack}
        paddingVertical
        rightButtons={[
          {
            icon: (
              <Icon
                customSize={'24px'}
                phosphorIcon={GearSix}
                type='phosphor'
                weight={'bold'}
              />
            ),
            onClick: onOpenActionModal
          }
        ]}
        showBackButton
        title={t('Manage website access')}
      />

      <SwList.Section
        displayRow
        enableSearchInput
        ignoreScrollbar={websiteAccessItems.length > 8}
        list={websiteAccessItems}
        renderItem={renderItem}
        renderWhenEmpty={renderEmptyList}
        rowGap = {'8px'}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder={t('Search website')} // todo: i18n this
      />

      <ActionModal
        actions={actions}
        id={ActionModalId}
        onCancel={onCloseActionModal}
        title={t('Website access config')}
      />
    </PageWrapper>
  );
}

const ManageWebsiteAccess = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%',
    backgroundColor: token.colorBgDefault,
    display: 'flex',
    flexDirection: 'column',

    '.ant-sw-list-section': {
      flex: 1
    }
  });
});

export default ManageWebsiteAccess;
