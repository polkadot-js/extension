// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson } from '@subwallet/extension-base/background/types';
import { WALLET_CONNECT_EIP155_NAMESPACE, WALLET_CONNECT_POLKADOT_NAMESPACE } from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { isProposalExpired, isSupportWalletConnectChain, isSupportWalletConnectNamespace } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { uniqueStringArray } from '@subwallet/extension-base/utils';
import { AccountItemWithName, AlertBox, ConfirmationGeneralInfo, WCNetworkSelected } from '@subwallet/extension-koni-ui/components';
import WCNetworkSupported from '@subwallet/extension-koni-ui/components/WalletConnect/WCNetworkSupported';
import { useNotification, useSelectWalletConnectAccount } from '@subwallet/extension-koni-ui/hooks';
import { approveWalletConnectSession, rejectWalletConnectSession } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, WalletConnectChainInfoWithStatus } from '@subwallet/extension-koni-ui/types';
import { chainsToWalletConnectChainInfos, convertKeyTypes, isAccountAll, isNoAccount, setSelectedAccountTypes } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, PlusCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

interface Props extends ThemeProps {
  request: WalletConnectSessionRequest
}

async function handleConfirm ({ id }: WalletConnectSessionRequest, selectedAccounts: string[]) {
  return await approveWalletConnectSession({
    id,
    accounts: selectedAccounts.filter((item) => !isAccountAll(item))
  });
}

async function handleCancel ({ id }: WalletConnectSessionRequest) {
  return await rejectWalletConnectSession({
    id
  });
}

export const filterAuthorizeAccounts = (accounts: AccountJson[], accountAuthType: AccountAuthType) => {
  let rs = [...accounts];

  // rs = rs.filter((acc) => acc.isReadOnly !== true);

  if (accountAuthType === 'evm') {
    rs = rs.filter((acc) => (!isAccountAll(acc.address) && acc.type === 'ethereum'));
  } else if (accountAuthType === 'substrate') {
    rs = rs.filter((acc) => (!isAccountAll(acc.address) && acc.type !== 'ethereum'));
  } else {
    rs = rs.filter((acc) => !isAccountAll(acc.address));
  }

  if (isNoAccount(rs)) {
    return [];
  }

  return rs;
};

function Component ({ className, request }: Props) {
  const { params } = request.request;

  const { t } = useTranslation();
  const navigate = useNavigate();
  const notification = useNotification();

  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [isExpired, setIsExpired] = useState(isProposalExpired(request.request));

  const isUnSupportCase = useMemo(() =>
    Object.values(params.requiredNamespaces)
      .map((namespace) => namespace.chains || [])
      .flat()
      .some((chain) => !isSupportWalletConnectChain(chain, chainInfoMap))
  , [chainInfoMap, params.requiredNamespaces]
  );

  const supportedChains = useMemo(() => {
    const chains: string[] = [];

    for (const [key, namespace] of Object.entries(params.requiredNamespaces)) {
      if (isSupportWalletConnectNamespace(key)) {
        chains.push(...(namespace.chains || []));
      }
    }

    for (const [key, namespace] of Object.entries(params.optionalNamespaces)) {
      if (isSupportWalletConnectNamespace(key)) {
        chains.push(...(namespace.chains || []));
      }
    }

    return chainsToWalletConnectChainInfos(chainInfoMap, uniqueStringArray(chains))
      .filter(({ chainInfo }) => !!chainInfo)
      .map((data): WalletConnectChainInfoWithStatus => ({ ...data, supported: true }));
  }, [chainInfoMap, params.optionalNamespaces, params.requiredNamespaces]);

  const nameSpaceNameMap = useMemo((): Record<string, string> => ({
    [WALLET_CONNECT_EIP155_NAMESPACE]: t('EVM networks'),
    [WALLET_CONNECT_POLKADOT_NAMESPACE]: t('Substrate networks')
  }), [t]);

  const { missingType, namespaceAccounts, onSelectAccount } = useSelectWalletConnectAccount(params);

  const [loading, setLoading] = useState(false);

  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onConfirm = useCallback(() => {
    setLoading(true);
    const selectedAccounts = Object.values(namespaceAccounts).map(({ selectedAccounts }) => selectedAccounts).flat();

    handleConfirm(request, selectedAccounts)
      .catch((e) => {
        notification({
          type: 'error',
          message: (e as Error).message,
          duration: 1.5
        });
      })
      .finally(() => {
        setLoading(false);
      });
  }, [namespaceAccounts, notification, request]);

  const onAddAccount = useCallback(() => {
    setSelectedAccountTypes(convertKeyTypes(missingType));
    navigate('/accounts/new-seed-phrase');
  }, [navigate, missingType]);

  useEffect(() => {
    const interval = setInterval(() => {
      const isExpired = !isProposalExpired(request.request);

      setIsExpired(isExpired);

      if (isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [request.request]);

  const isSupportCase = !isUnSupportCase && !isExpired;
  const haveOneSupportChain = supportedChains.length === 1;

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        {
          isUnSupportCase && (
            <>
              <AlertBox
                description={t('There is at least 1 chosen network unavailable')}
                title={t('Unsupported network')}
                type='warning'
              />
              <WCNetworkSupported
                id='support-networks'
                networks={supportedChains}
              />
            </>
          )
        }
        {
          !isUnSupportCase && isExpired && (
            <>
              <AlertBox
                description={t('Connection expired. Please create a new connection from dApp')}
                title={t('Connection expired')}
                type='warning'
              />
            </>
          )
        }
        {
          isSupportCase && (
            <>
              {
                Object.entries(namespaceAccounts).map(([namespace, { availableAccounts, networks, selectedAccounts }]) => {
                  if (haveOneSupportChain) {
                    return <></>;
                  }

                  return (
                    <div key={namespace}>
                      <div className='namespace-title'>{nameSpaceNameMap[namespace]}</div>
                      <WCNetworkSelected
                        id={`${namespace}-networks`}
                        networks={networks}
                      />
                      {availableAccounts.map((item) => (
                        <AccountItemWithName
                          accountName={item.name}
                          address={item.address}
                          avatarSize={24}
                          genesisHash={item.genesisHash}
                          isSelected={selectedAccounts.includes(item.address)}
                          key={item.address}
                          onClick={onSelectAccount(namespace, item.address)}
                          showUnselectIcon
                        />
                      ))}
                    </div>
                  );
                })
              }
            </>
          )
        }
      </div>
      <div className='confirmation-footer'>
        {
          !isSupportCase && (
            <Button
              disabled={loading}
              icon={(
                <Icon
                  phosphorIcon={XCircle}
                  weight='fill'
                />
              )}
              onClick={onCancel}
              schema={'secondary'}
            >
              {t('Cancel')}
            </Button>
          )
        }
        {
          isSupportCase && !missingType.length &&
          (
            <>
              <Button
                disabled={loading}
                icon={(
                  <Icon
                    phosphorIcon={XCircle}
                    weight='fill'
                  />
                )}
                onClick={onCancel}
                schema={'secondary'}
              >
                {t('Cancel')}
              </Button>
              <Button
                // disabled={Object.values(selectedMap).every((value) => !value)}
                icon={(
                  <Icon
                    phosphorIcon={CheckCircle}
                    weight='fill'
                  />
                )}
                loading={loading}
                onClick={onConfirm}
              >
                {t('Approve')}
              </Button>
            </>
          )
        }
        {
          isSupportCase && !!missingType.length &&
            (
              <>
                <Button
                  disabled={loading}
                  icon={(
                    <Icon
                      phosphorIcon={XCircle}
                      weight='fill'
                    />
                  )}
                  onClick={onCancel}
                  schema={'secondary'}
                >
                  {t('Cancel')}
                </Button>
                <Button
                  disabled={loading}
                  icon={(
                    <Icon
                      phosphorIcon={PlusCircle}
                      weight='fill'
                    />
                  )}
                  onClick={onAddAccount}
                >
                  {t('Create one')}
                </Button>
              </>
            )
        }
      </div>
    </>
  );
}

const ConnectWalletConnectConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '--content-gap': token.size,

  '.title.sub-title': {
    fontSize: token.fontSizeHeading6,
    lineHeight: token.lineHeightHeading6,
    textAlign: 'start'
  },

  '.account-list': {
    display: 'flex',
    flexDirection: 'column',
    gap: token.sizeXS
  },

  '.namespace-title': {
    fontSize: '11px',
    fontWeight: token.fontWeightStrong,
    lineHeight: '20px',
    textTransform: 'uppercase',
    textAlign: 'left',
    color: token.colorTextSecondary,
    marginBottom: token.marginXS
  }
}));

export default ConnectWalletConnectConfirmation;
