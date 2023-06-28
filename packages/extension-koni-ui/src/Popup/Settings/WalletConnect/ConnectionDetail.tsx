// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stripUrl } from '@subwallet/extension-base/utils';
import { Layout, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useConfirmModal, useNotification, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { disconnectWalletConnectConnection } from '@subwallet/extension-koni-ui/messaging';
import { ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-koni-ui/types';
import { noop } from '@subwallet/extension-koni-ui/utils';
import { chainsToWalletConnectChainInfos } from '@subwallet/extension-koni-ui/utils/walletConnect';
import { Icon, Image, Logo, SwModalFuncProps } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import { Plugs } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface ComponentProps {
  session: SessionTypes.Struct;
}

const disconnectModalId = 'disconnect-connection-modal';

const Component: React.FC<ComponentProps> = (props) => {
  const { session } = props;
  const { namespaces, peer: { metadata: dAppInfo }, topic } = session;

  const domain = stripUrl(dAppInfo.url);
  const img = dAppInfo.icons[0];

  const { t } = useTranslation();
  const notification = useNotification();
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const chains = useMemo((): WalletConnectChainInfo[] => {
    const chains = Object.values(namespaces).map((namespace) => namespace.chains || []).flat();

    return chainsToWalletConnectChainInfos(chainInfoMap, chains);
  }, [namespaces, chainInfoMap]);

  const fistChain = useMemo(() => chains.find(({ chainInfo }) => !!chainInfo), [chains]);

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
    content: t('If someone has your secret phrase, they will have full control of your account'),
    subTitle: t('Disconnect confirmation message'),
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

  return (
    <Layout.WithSubHeaderOnly
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
      title={t('Wallet connect')}
    >
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
            <div className='network-content'>
              <Logo
                className={'__chain-logo'}
                network={fistChain?.slug || ''}
                size={24}
              />
              <div className='network-name'>{domain}</div>
            </div>
          </MetaInfo.Default>
        </MetaInfo>
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

type Props = ThemeProps;

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const navigate = useNavigate();

  const dataContext = useContext(DataContext);

  const { reduxStatus, sessions } = useSelector((state) => state.walletConnect);

  const params = useParams();

  const topic = params.topic as string;

  const session = useMemo(() => sessions[topic], [sessions, topic]);

  useEffect(() => {
    if (!session && reduxStatus === ReduxStatus.READY) {
      navigate('/wallet-connect/list');
    }
  }, [session, reduxStatus, navigate]);

  if (!session && reduxStatus === ReduxStatus.READY) {
    return null;
  }

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['walletConnect'])}
    >
      <Component session={session} />
    </PageWrapper>
  );
};

const ConnectionDetail = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: token.padding
    },

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
          '--img-height': token.sizeLG,
          '--img-width': token.sizeLG
        },

        '.dapp-info-domain': {
          overflow: 'hidden',
          textWrap: 'nowrap',
          textOverflow: 'ellipsis'
        }
      }
    }
  };
});

export default ConnectionDetail;
