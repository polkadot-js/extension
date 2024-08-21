// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AbstractAddressJson, AccountJson } from '@subwallet/extension-base/background/types';
import { stripUrl } from '@subwallet/extension-base/utils';
import { AccountItemWithName, EmptyList, GeneralEmptyList, Layout, MetaInfo, PageWrapper, WCNetworkAvatarGroup } from '@subwallet/extension-web-ui/components';
import { BaseModal } from '@subwallet/extension-web-ui/components/Modal/BaseModal';
import { WALLET_CONNECT_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { useConfirmModal, useNotification, useSelector } from '@subwallet/extension-web-ui/hooks';
import { disconnectWalletConnectConnection } from '@subwallet/extension-web-ui/messaging';
import { ReduxStatus } from '@subwallet/extension-web-ui/stores/types';
import { Theme, ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-web-ui/types';
import { chainsToWalletConnectChainInfos, getWCAccountList, noop } from '@subwallet/extension-web-ui/utils';
import { Button, Icon, Image, ModalContext, NetworkItem, SwList, SwModalFuncProps } from '@subwallet/react-ui';
import { SwModalProps } from '@subwallet/react-ui/es/sw-modal/SwModal';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { Info, MagnifyingGlass, Plugs } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

interface ComponentProps {
  isModal?: boolean;
  session: SessionTypes.Struct;
  className?: string;
}

const renderNetworkEmpty = () => <GeneralEmptyList />;

const disconnectModalId = 'disconnect-connection-modal';
const networkModalId = 'connection-detail-networks-modal';

const Component: React.FC<ComponentProps> = (props) => {
  const { className, isModal, session } = props;
  const { namespaces, peer: { metadata: dAppInfo }, topic } = session;

  const { t } = useTranslation();
  const notification = useNotification();
  const navigate = useNavigate();
  const { token } = useTheme() as Theme;

  const domain = useMemo(() => {
    try {
      return stripUrl(dAppInfo.url);
    } catch (e) {
      return dAppInfo.url;
    }
  }, [dAppInfo.url]);

  const img = `https://icons.duckduckgo.com/ip2/${domain}.ico`;

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { chainInfoMap } = useSelector((state) => state.chainStore);
  const { accounts } = useSelector((state) => state.accountState);

  const chains = useMemo((): WalletConnectChainInfo[] => {
    const chains = Object.values(namespaces).map((namespace) => namespace.chains || []).flat();

    return chainsToWalletConnectChainInfos(chainInfoMap, chains);
  }, [namespaces, chainInfoMap]);

  const accountItems = useMemo((): AbstractAddressJson[] => getWCAccountList(accounts, namespaces), [accounts, namespaces]);

  const modalProps = useMemo((): Partial<SwModalFuncProps> => ({
    id: disconnectModalId,
    okText: t('Disconnect'),
    okButtonProps: {
      icon: (
        <Icon
          phosphorIcon={Plugs}
          weight='fill'
        />
      )
    },
    content: t('Once you disconnect, you will no longer see this connection on SubWallet and on your DApp.'),
    subTitle: t('Are you sure you want to disconnect?'),
    title: t('Disconnect'),
    type: 'error',
    closable: true
  }), [t]);

  const { handleSimpleConfirmModal } = useConfirmModal(modalProps);

  const [loading, setLoading] = useState(false);

  const onDisconnect = useCallback(() => {
    handleSimpleConfirmModal()
      .then(() => {
        setLoading(true);
        disconnectWalletConnectConnection(topic)
          .catch((e) => {
            console.log(e);
            notification({
              type: 'error',
              message: t('Fail to disconnect')
            });
          });
      })
      .catch(noop)
      .finally(() => {
        setLoading(false);
      });
  }, [handleSimpleConfirmModal, notification, t, topic]);

  const goBack = useCallback(() => {
    navigate('/wallet-connect/list');
  }, [navigate]);

  const renderAccountItem = useCallback((item: AccountJson) => {
    return (
      <AccountItemWithName
        accountName={item.name}
        address={item.address}
        avatarSize={token.sizeLG}
        key={item.address}
      />
    );
  }, [token.sizeLG]);

  const renderChainItem = useCallback((item: WalletConnectChainInfo) => {
    return (
      <NetworkItem
        key={item.slug}
        name={item.chainInfo?.name || t('Unknown network ({{slug}})', { replace: { slug: item.slug } })}
        networkKey={item.slug}
        networkMainLogoShape='squircle'
        networkMainLogoSize={28}
      />
    );
  }, [t]);

  const renderAccountEmpty = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your accounts will appear here.')}
        emptyTitle={t('No account found')}
        phosphorIcon={MagnifyingGlass}
      />
    );
  }, [t]);

  const openNetworkModal = useCallback(() => {
    activeModal(networkModalId);
  }, [activeModal]);

  const closeNetworkModal = useCallback(() => {
    inactiveModal(networkModalId);
  }, [inactiveModal]);

  const searchFunction = useCallback((item: WalletConnectChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.chainInfo?.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const contentNode = (
    <div className='body-container'>
      <MetaInfo
        hasBackgroundWrapper
      >
        <MetaInfo.Default
          className='dapp-info-container'
          label={t('DApp')}
        >
          <div className='dapp-info-content'>
            <Image
              className='dapp-info-img'
              height='var(--img-height)'
              src={img}
              width='var(--img-width)'
            />
            <div className='dapp-info-domain'>{domain}</div>
          </div>
        </MetaInfo.Default>
        <MetaInfo.Default
          className='network-container'
          label={t('Network')}
        >
          <div
            className='network-content'
            onClick={openNetworkModal}
          >
            <WCNetworkAvatarGroup networks={chains} />
            <div className='network-name'>
              {t('{{number}} network(s)', { replace: { number: chains.length } })}
            </div>
            <Icon
              phosphorIcon={Info}
              size='sm'
              weight='fill'
            />
          </div>
        </MetaInfo.Default>
      </MetaInfo>
      <div className='total-account'>
        {t('{{number}} {{account}} connected', { replace: { number: accountItems.length, account: accountItems.length > 1 ? 'accounts' : 'account' } })}
      </div>
      <SwList.Section
        className='account-list'
        displayRow
        list={accountItems}
        renderItem={renderAccountItem}
        renderWhenEmpty={renderAccountEmpty}
        rowGap='var(--row-gap)'
      />
      <BaseModal
        className={CN(className, 'network-modal')}
        id={networkModalId}
        onCancel={closeNetworkModal}
        title={t('Connected network')}
      >
        <SwList.Section
          className='network-list'
          displayRow
          enableSearchInput={true}
          list={chains}
          renderItem={renderChainItem}
          renderWhenEmpty={renderNetworkEmpty}
          rowGap='var(--row-gap)'
          searchFunction={searchFunction}
          searchPlaceholder={t<string>('Network name')}
        />
      </BaseModal>
    </div>
  );

  if (isModal) {
    return (
      <>
        {contentNode}

        <div className='__footer'>
          <Button
            block={true}
            icon={(
              <Icon
                phosphorIcon={Plugs}
                weight='fill'
              />
            )}
            loading={loading}
            onClick={onDisconnect}
            schema={'danger'}
          >
            {t('Disconnect')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <Layout.WithSubHeaderOnly
      className={'setting-pages'}
      onBack={goBack}
      rightFooterButton={{
        icon: (
          <Icon
            phosphorIcon={Plugs}
            weight='fill'
          />
        ),
        children: t('Disconnect'),
        schema: 'danger',
        loading: loading,
        onClick: onDisconnect
      }}
      title={t('WalletConnect')}
    >
      {contentNode}
    </Layout.WithSubHeaderOnly>
  );
};

type Props = ThemeProps & {
  topic?: string;
  isModal?: boolean;
  modalProps?: {
    closeIcon?: SwModalProps['closeIcon'],
    onCancel?: SwModalProps['onCancel'],
  };
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className, isModal, modalProps = {}, topic: topicProp } = props;

  const { t } = useTranslation();

  const navigate = useNavigate();

  const dataContext = useContext(DataContext);

  const { reduxStatus, sessions } = useSelector((state) => state.walletConnect);

  const params = useParams();

  const _topic = params.topic as string;

  const topic = topicProp || _topic;

  const session = useMemo(() => sessions[topic], [sessions, topic]);

  useEffect(() => {
    if (!isModal && !session && reduxStatus === ReduxStatus.READY) {
      navigate('/wallet-connect/list');
    }
  }, [session, reduxStatus, navigate, isModal]);

  if (!session && reduxStatus === ReduxStatus.READY) {
    return null;
  }

  if (isModal) {
    return (
      <BaseModal
        {...modalProps}
        className={CN(className, '-modal')}
        id={WALLET_CONNECT_DETAIL_MODAL}
        title={t('WalletConnect')}
      >
        <PageWrapper
          className={'__modal-content'}
          resolve={dataContext.awaitStores(['walletConnect'])}
        >
          <Component
            className={className}
            isModal={true}
            session={session}
          />
        </PageWrapper>
      </BaseModal>
    );
  }

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['walletConnect'])}
    >
      <Component
        className={className}
        session={session}
      />
    </PageWrapper>
  );
};

const ConnectionDetail = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: token.padding
    },
    '--row-gap': `${token.sizeXS}px`,

    '.dapp-info-container': {
      '.__col.-to-right': {
        flex: 3,

        '.__value': {
          overflow: 'hidden',
          maxWidth: '100%'
        }
      },

      '.dapp-info-content': {
        display: 'flex',
        flexDirection: 'row',
        gap: token.sizeXS,
        alignItems: 'center',

        '.dapp-info-img': {
          '--img-height': `${token.sizeLG}px`,
          '--img-width': `${token.sizeLG}px`
        },

        '.dapp-info-domain': {
          overflow: 'hidden',
          textWrap: 'nowrap',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }
      }
    },

    '.network-container': {
      '.__col.-to-right': {
        flex: 3,

        '.__value': {
          overflow: 'hidden',
          maxWidth: '100%'
        }
      },

      '.network-content': {
        display: 'flex',
        flexDirection: 'row',
        gap: token.sizeXS,
        alignItems: 'center',
        cursor: 'pointer'
      }
    },

    '.account-list': {
      margin: `0 -${token.margin}px`,

      '.ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    },

    '.total-account': {
      marginTop: token.margin,
      marginBottom: token.marginXXS,
      color: token.colorTextTertiary,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '&.network-modal': {
      '.ant-sw-modal-body': {
        padding: `${token.padding}px 0 ${token.padding}px`,
        flexDirection: 'column',
        display: 'flex'
      }
    },

    '&.-modal': {
      '.__modal-content': {
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      },
      '.body-container': {
        padding: 0,
        overflow: 'auto',
        minHeight: 330
      },
      '.__footer': {
        paddingTop: token.padding
      }
    }
  };
});

export default ConnectionDetail;
