// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountJson } from '@polkadot/extension-base/background/types';
import { EditMenuCard, Identicon } from '@polkadot/extension-ui/components';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import { IconTheme } from '@polkadot/react-identicon/types';

import forgetIcon from '../../assets/forget.svg';
import subAccountIcon from '../../assets/subAccount.svg';
import { Switch } from '../../components';
import { AccountContext, SettingsContext } from '../../components/contexts';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { showAccount } from '../../messaging';
import Header from '../../partials/Header';
import { ellipsisName } from '../../util/ellipsisName';

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
  isExternal?: string;
}

function EditAccountMenu({
  className,
  location: { search },
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts, hierarchy } = useContext(AccountContext);
  const { show } = useToast();

  const searchParams = new URLSearchParams(search);
  const isExternal = searchParams.get('isExternal');

  function findAccountInHierarchy(accounts: AccountJson[], _address: string) {
    return hierarchy.find(({ address }): boolean => address === _address) || null;
  }

  const _onCopy = useCallback(() => show(t<string>('Public address copied to your clipboard'), 'success'), [show, t]);

  const [account, setAccount] = useState(findAccountInHierarchy(accounts, address));

  const [isHidden, setIsHidden] = useState(account?.isHidden);

  const chain = useMetadata(account?.genesisHash, true);

  const settings = useContext(SettingsContext);

  const prefix = chain ? chain.ss58Format : settings.prefix === -1 ? 42 : settings.prefix;

  const theme = (account && account.type === 'ethereum' ? 'ethereum' : chain?.icon || 'polkadot') as IconTheme;

  const _toggleVisibility = useCallback((): void => {
    if (address) {
      showAccount(address, isHidden || false)
        .then((data) => {
          if (account) {
            setAccount({
              ...account,
              isHidden: !account.isHidden
            });
          }

          setIsHidden(data);
        })
        .catch(console.error);
    }
  }, [address, isHidden, account]);

  return (
    <>
      <Header
        showBackArrow
        showHelp
        text={t<string>('Edit Account')}
      />
      <div className={className}>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal === 'true'}
          onCopy={_onCopy}
          prefix={prefix}
          value={address}
        />
        <EditMenuCard
          description={account?.name || ''}
          extra='chevron'
          position='top'
          title='Name'
        />
        <CopyToClipboard text={(address && address) || ''}>
          <EditMenuCard
            description={ellipsisName(address) || ''}
            extra='copy'
            onClick={_onCopy}
            position='middle'
            title='Address'
          />
        </CopyToClipboard>
        <EditMenuCard
          description={chain?.genesisHash ? 'testnet' : 'Mainnet'}
          extra='chevron'
          position='middle'
          title='Network'
        />
        <EditMenuCard
          description=''
          position='bottom'
          title='Visibility for apps'
          toggle={
            <>
              <Switch
                checked={!account?.isHidden || false}
                checkedLabel=''
                onChange={_toggleVisibility}
                uncheckedLabel=''
              />
            </>
          }
        />
        <EditMenuCard
          description=''
          extra='chevron'
          position='both'
          preIcon={<img src={subAccountIcon} />}
          title='Create a sub-account'
        />
        <EditMenuCard
          description=''
          extra='chevron'
          isDanger
          position='both'
          preIcon={<img src={forgetIcon} />}
          title='Forget'
        />
      </div>
    </>
  );
}

export default React.memo(
  withRouter(
    styled(EditAccountMenu)(
      ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  height: calc(100vh - 2px);
  overflow-y: scroll;
  scrollbar-width: none;
      
  .identityIcon {
    display: flex;
    justify-content: center;
    margin: 0 auto;
    width: 80px;
    height: 80px;
    margin-bottom: 18px;

    & svg {
      width: 80px;
      height: 80px;
    }
  }

  &::-webkit-scrollbar {
    display: none;
  }
  `
    )
  )
);
