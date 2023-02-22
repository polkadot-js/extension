// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountAuthType, AccountJson, AuthorizeRequest } from '@subwallet/extension-base/background/types';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import AccountItemWithName from '@subwallet/extension-koni-ui/components/Account/Item/AccountItemWithName';
import ConfirmationGeneralInfo from '@subwallet/extension-koni-ui/components/Confirmation/ConfirmationGeneralInfo';
import { approveAuthRequestV2, cancelAuthRequestV2, rejectAuthRequestV2 } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/util';
import { Button, Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ShieldSlash, UserPlus } from 'phosphor-react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

  rs = rs.filter((acc) => acc.isReadOnly !== true);

  if (accountAuthType === 'evm') {
    rs = rs.filter((acc) => (isAccountAll(acc.address) || acc.type === 'ethereum'));
  } else {
    rs = rs.filter((acc) => (isAccountAll(acc.address) || acc.type !== 'ethereum'));
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

  // Selected map with default values is map of all acounts
  const [selectedMap, setSelectedMap] = useState<Record<string, boolean>>({});

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
    // Todo: Create new account type depend on auth type
    navigate('/account/add-account/from-seed');
  }, [navigate]);

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

  return (
    <>
      <div className={CN('confirmation-content', className)}>
        <ConfirmationGeneralInfo request={request} />
        {visibleAccounts.length === 0 && <div className={'account-list text-center'}>
          <Typography.Title level={4}>
            {t('Don\'t have any suitable accounts')}
          </Typography.Title>
          <Typography.Paragraph className='text-tertiary'>
            {t('Don\'t have any suitable accounts to connect, please create a new account')}
          </Typography.Paragraph>
        </div>}
        {visibleAccounts.length > 0 && <div className={'account-list'}>
          <Typography.Paragraph>
            {t('Choose the account(s) you’d like to connect')}
          </Typography.Paragraph>
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
          <Typography.Paragraph className='text-tertiary text-center'>
            {t('Make sure you trust this site before connecting')}
          </Typography.Paragraph>
        </div>}
      </div>
      <div className='confirmation-footer'>
        {visibleAccounts.length > 0 && <>
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
            loading={loading}
            onClick={onConfirm}
          >
            {t('Connect')}
          </Button>
        </>}
        {visibleAccounts.length === 0 && <Button
          disabled={loading}
          icon={<Icon phosphorIcon={UserPlus} />}
          onClick={onAddAccount}
        >
          {t('Create a new account')}
        </Button>}
      </div>
    </>
  );
}

const AuthorizeConfirmation = styled(Component)<Props>(({ theme: { token } }: ThemeProps) => ({
  '.account-list': {
    '.account-item-with-name': {
      marginBottom: token.marginXS
    }
  }
}));

export default AuthorizeConfirmation;
