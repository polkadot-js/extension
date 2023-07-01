// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { WALLET_CONNECT_EIP155_NAMESPACE, WALLET_CONNECT_POLKADOT_NAMESPACE } from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { isProposalExpired, isSupportWalletConnectChain, isSupportWalletConnectNamespace } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { uniqueStringArray } from '@subwallet/extension-base/utils';
import { AlertBox, ConfirmationGeneralInfo } from '@subwallet/extension-koni-ui/components';
import WCNetworkSupported from '@subwallet/extension-koni-ui/components/WalletConnect/WCNetworkSupported';
import { EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants';
import { useNotification } from '@subwallet/extension-koni-ui/hooks';
import { approveWalletConnectSession, rejectWalletConnectSession } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps, WalletConnectChainInfoWithStatus } from '@subwallet/extension-koni-ui/types';
import { chainsToWalletConnectChainInfos, isAccountAll, isNoAccount } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle, PlusCircle, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';
import { KeypairType } from '@polkadot/util-crypto/types';

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

  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const [isExpired, setIsExpired] = useState(isProposalExpired(request.request));

  const isUnSupportCase = useMemo(() =>
    Object.values(params.requiredNamespaces)
      .map((namespace) => namespace.chains || [])
      .flat()
      .some((chain) => !isSupportWalletConnectChain(chain, chainInfoMap))
  , [chainInfoMap, params.requiredNamespaces]
  );

  const supportedNamespaces = useMemo(() => {
    const namespaces: string[] = [];

    for (const namespace of Object.keys(params.requiredNamespaces)) {
      if (isSupportWalletConnectNamespace(namespace)) {
        namespaces.push(namespace);
      }
    }

    for (const namespace of Object.keys(params.optionalNamespaces)) {
      if (isSupportWalletConnectNamespace(namespace)) {
        namespaces.push(namespace);
      }
    }

    return uniqueStringArray(namespaces);
  }, [params.optionalNamespaces, params.requiredNamespaces]);

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

  const accountAuthType = useMemo((): AccountAuthType => {
    return [...Object.keys(params.requiredNamespaces), ...Object.keys(params.optionalNamespaces)]
      .reduce((previousResult: AccountAuthType, currentValue): AccountAuthType => {
        const [namespace] = currentValue.split(':');

        if (namespace === WALLET_CONNECT_EIP155_NAMESPACE) {
          if (['both', 'substrate'].includes(previousResult)) {
            return 'both';
          } else {
            return 'evm';
          }
        } else if (namespace === WALLET_CONNECT_POLKADOT_NAMESPACE) {
          if (['both', 'evm'].includes(previousResult)) {
            return 'both';
          } else {
            return 'substrate';
          }
        } else {
          return previousResult;
        }
      }, '' as AccountAuthType);
  }, [params.optionalNamespaces, params.requiredNamespaces]);

  // List all of all accounts by auth type
  const visibleAccounts = useMemo(() => (filterAuthorizeAccounts(accounts, accountAuthType || 'both')),
    [accountAuthType, accounts]);

  const missingType = useMemo((): AccountAuthType[] => {
    const _type: AccountAuthType = accountAuthType || 'both';
    let result: AccountAuthType[] = _type === 'both' ? ['evm', 'substrate'] : [_type];

    visibleAccounts.forEach((account) => {
      if (isEthereumAddress(account.address)) {
        result = result.filter((value) => value !== 'evm');
      } else {
        result = result.filter((value) => value !== 'substrate');
      }
    });

    return result;
  }, [accountAuthType, visibleAccounts]);

  // Selected map with default values is map of all accounts
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  const [loading, setLoading] = useState(false);

  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onConfirm = useCallback(() => {
    setLoading(true);
    const selectedAccounts = Object.keys(selectedMap).filter((key) => selectedMap[key]);

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
  }, [notification, request, selectedMap]);

  const onAddAccount = useCallback(() => {
    let types: KeypairType[];

    switch (accountAuthType) {
      case 'substrate':
        types = [SUBSTRATE_ACCOUNT_TYPE];
        break;
      case 'evm':
        types = [EVM_ACCOUNT_TYPE];
        break;
      default:
        types = [SUBSTRATE_ACCOUNT_TYPE, EVM_ACCOUNT_TYPE];
    }

    navigate('/accounts/new-seed-phrase', { state: { accountTypes: types } });
  }, [navigate, accountAuthType]);

  const onAccountSelect = useCallback((address: string) => {
    const isAll = isAccountAll(address);

    return () => {
      const visibleAddresses = visibleAccounts.map((item) => item.address);

      setSelectedMap((map) => {
        const isChecked = !map[address];
        const newMap = { ...map };

        if (isAll) {
          // Select/deselect all accounts
          visibleAddresses.forEach((key) => {
            newMap[key] = isChecked;
          });
          newMap[ALL_ACCOUNT_KEY] = isChecked;
        } else {
          // Select/deselect single account and trigger all account
          newMap[address] = isChecked;
          newMap[ALL_ACCOUNT_KEY] = visibleAddresses
            .filter((i) => !isAccountAll(i))
            .every((item) => newMap[item]);
        }

        return newMap;
      });
    };
  }, [visibleAccounts]);

  console.debug(missingType); // TODO: need remove

  useEffect(() => {
    const interval = setInterval(() => {
      setIsExpired(isProposalExpired(request.request));
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [request.request]);

  const isSupportCase = !isUnSupportCase && !isExpired;

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
            <></>
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
                disabled={Object.values(selectedMap).every((value) => !value)}
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
  }
}));

export default ConnectWalletConnectConfirmation;
