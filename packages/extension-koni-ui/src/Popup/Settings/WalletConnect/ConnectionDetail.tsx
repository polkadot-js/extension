// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { stripUrl } from '@subwallet/extension-base/utils';
import { Layout, MetaInfo, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ReduxStatus } from '@subwallet/extension-koni-ui/stores/types';
import { ThemeProps, WalletConnectChainInfo } from '@subwallet/extension-koni-ui/types';
import { Image, Logo } from '@subwallet/react-ui';
import { SessionTypes } from '@walletconnect/types';
import CN from 'classnames';
import React, { useContext, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { chainsToWalletConnectChainInfos } from '@subwallet/extension-koni-ui/utils/walletConnect';

interface ComponentProps {
  session: SessionTypes.Struct;
}

const Component: React.FC<ComponentProps> = (props) => {
  const { session } = props;
  const { peer: { metadata: dAppInfo }, topic, namespaces } = session;

  const { t } = useTranslation();
  const { chainInfoMap } = useSelector((state) => state.chainStore);

  const chains = useMemo((): WalletConnectChainInfo[] => {
    const chains = Object.values(namespaces).map((namespace) => namespace.chains || []).flat();
    return chainsToWalletConnectChainInfos(chainInfoMap, chains);
  }, [namespaces, chainInfoMap]);

  const domain = stripUrl(dAppInfo.url);
  const img = dAppInfo.icons[0];

  const fistChain = useMemo(() => chains.find(({chainInfo}) => !!chainInfo), [chains])

  return (
    <Layout.WithSubHeaderOnly
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
            <div className='dapp-info-content'>
              <Logo
                className={'__chain-logo'}
                network={fistChain?.slug || ''}
                size={24}
              />
              <div className='dapp-info-domain'>{domain}</div>
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
