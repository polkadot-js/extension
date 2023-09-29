// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson, AuthorizeRequest } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { AccountItemWithName, ConfirmationGeneralInfo } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_ACCOUNT_TYPES, EVM_ACCOUNT_TYPE, SUBSTRATE_ACCOUNT_TYPE } from '@subwallet/extension-koni-ui/constants';
import { approveAuthRequestV2, cancelAuthRequestV2, rejectAuthRequestV2 } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, isNoAccount, setSelectedAccountTypes } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { PlusCircle, ShieldSlash, XCircle } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { KeypairType } from '@polkadot/util-crypto/types';

interface Props extends ThemeProps {
  request: AuthorizeRequest
}

async function handleConfirm ({ id }: AuthorizeRequest, selectedAccounts: string[]) {
  return await approveAuthRequestV2(id, selectedAccounts.filter((item) => !isAccountAll(item)));
}

async function handleCancel ({ id }: AuthorizeRequest) {
  return await cancelAuthRequestV2(id);
}

async function handleBlock ({ id }: AuthorizeRequest) {
  return await rejectAuthRequestV2(id);
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
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const { accountAuthType, allowedAccounts } = request.request;
  const accounts = useSelector((state: RootState) => state.accountState.accounts);
  const navigate = useNavigate();

  // List all of all accounts by auth type
  const visibleAccounts = useMemo(() => (filterAuthorizeAccounts(accounts, accountAuthType || 'both')),
    [accountAuthType, accounts]);

  // Selected map with default values is map of all accounts
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

  const isDisableConnect = useMemo(() => {
    return !visibleAccounts.filter(({ address }) => !!selectedMap[address]).length;
  }, [selectedMap, visibleAccounts]);

  // Handle buttons actions
  const onBlock = useCallback(() => {
    setLoading(true);
    handleBlock(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onCancel = useCallback(() => {
    setLoading(true);
    handleCancel(request).finally(() => {
      setLoading(false);
    });
  }, [request]);

  const onConfirm = useCallback(() => {
    setLoading(true);
    const selectedAccounts = Object.keys(selectedMap).filter((key) => selectedMap[key]);

    handleConfirm(request, selectedAccounts).finally(() => {
      setLoading(false);
    });
  }, [request, selectedMap]);

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
        types = DEFAULT_ACCOUNT_TYPES;
    }

    setSelectedAccountTypes(types);
    navigate('/accounts/new-seed-phrase', { state: { useGoBack: true } });
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

  // Create selected map by default
  useEffect(() => {
    setSelectedMap((map) => {
      const existedKey = Object.keys(map);

      accounts.forEach((item) => {
        if (!existedKey.includes(item.address)) {
          map[item.address] = (allowedAccounts || []).includes(item.address);
        }
      });

      map[ALL_ACCOUNT_KEY] = visibleAccounts.every((item) => map[item.address]);

      return { ...map };
    });
  }, [accounts, allowedAccounts, visibleAccounts]);

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        <div
          className={CN(
            'title',
            {
              'sub-title': visibleAccounts.length > 0
            }
          )}
        >
          {
            visibleAccounts.length === 0
              ? t('No available account')
              : t('Choose the account(s) you’d like to connect')
          }
        </div>
        {
          !!visibleAccounts.length && (
            <div className='account-list'>
              {
                visibleAccounts.length > 1 &&
                  (
                    <AccountItemWithName
                      accountName={'All account'}
                      accounts={visibleAccounts}
                      address={ALL_ACCOUNT_KEY}
                      avatarSize={24}
                      isSelected={selectedMap[ALL_ACCOUNT_KEY]}
                      onClick={onAccountSelect(ALL_ACCOUNT_KEY)}
                      showUnselectIcon
                    />
                  )
              }
              {visibleAccounts.map((item) => (
                <AccountItemWithName
                  accountName={item.name}
                  address={item.address}
                  avatarSize={24}
                  genesisHash={item.genesisHash}
                  isSelected={selectedMap[item.address]}
                  key={item.address}
                  onClick={onAccountSelect(item.address)}
                  showUnselectIcon
                />
              ))}
            </div>
          )
        }
        <div className='description'>
          {
            visibleAccounts.length === 0
              ? t("You don't have any accounts to connect. Please create or import an account.")
              : t('Make sure you trust this site before connecting')
          }
        </div>
      </div>
      <div className='confirmation-footer'>
        {
          visibleAccounts.length > 0 &&
          (
            <>
              <Button
                className={'icon-btn'}
                danger={true}
                disabled={loading}
                icon={<Icon phosphorIcon={ShieldSlash} />}
                onClick={onBlock}
              />
              <Button
                disabled={loading}
                onClick={onCancel}
                schema={'secondary'}
              >
                {t('Cancel')}
              </Button>
              <Button
                disabled={isDisableConnect}
                loading={loading}
                onClick={onConfirm}
              >
                {t('Connect')}
              </Button>
            </>
          )
        }
        {
          visibleAccounts.length === 0 &&
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

const AuthorizeConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
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

export default AuthorizeConfirmation;
