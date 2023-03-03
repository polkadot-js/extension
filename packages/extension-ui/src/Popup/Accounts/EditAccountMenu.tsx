// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import { EditMenuCard, Identicon } from '@polkadot/extension-ui/components';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import { IconTheme } from '@polkadot/react-identicon/types';

import exportAccountIcon from '../../assets/export.svg';
import subAccountIcon from '../../assets/subAccount.svg';
import forgetIcon from '../../assets/vanish.svg';
import { Svg, Switch } from '../../components';
import { AccountContext, ActionContext, SettingsContext } from '../../components/contexts';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
import { showAccount } from '../../messaging';
import Header from '../../partials/Header';
import { DEFAULT_TYPE } from '../../util/defaultType';
import { ellipsisName } from '../../util/ellipsisName';
import { recodeAddress } from '../../util/recodeAddress';

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
  const { accounts, master } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const { show } = useToast();

  const searchParams = new URLSearchParams(search);
  const isExternal = searchParams.get('isExternal');

  const account = useMemo(() => accounts.find((account) => account.address === address), [accounts, address]);

  const [isHidden, setIsHidden] = useState(account?.isHidden);

  const chain = useMetadata(account?.genesisHash, true);

  const type = chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE;

  const settings = useContext(SettingsContext);

  const prefix = chain ? chain.ss58Format : settings.prefix === -1 ? 42 : settings.prefix;

  const theme = (account && account.type === 'ethereum' ? 'ethereum' : chain?.icon || 'polkadot') as IconTheme;

  const _onCopy = useCallback(() => show(t<string>('Public address copied to your clipboard'), 'success'), [show, t]);

  const _toggleVisibility = useCallback((): void => {
    if (address) {
      showAccount(address, isHidden || false)
        .then(() => {
          setIsHidden(!isHidden);
          show(t<string>('Visibility for apps changed successfully'), 'success');
        })
        .catch(console.error);
    }
  }, [address, isHidden, show, t]);

  const goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const { account: recodedAccount, formatted } = useMemo(
    () => recodeAddress(address, accounts, chain, settings),
    [accounts, address, chain, settings]
  );

  return (
    <>
      <Header
        text={t<string>('Edit Account')}
        withBackArrow
        withGoToRoot
        withHelp
      />
      <div className={className}>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal === 'true'}
          onCopy={_onCopy}
          prefix={prefix}
          value={formatted || recodedAccount?.address}
        />
        <EditMenuCard
          description={account?.name || ''}
          extra='chevron'
          onClick={goTo(`/account/edit-name/${address}`)}
          position='top'
          title={t<string>('Name')}
        />
        <CopyToClipboard text={(address && address) || ''}>
          <EditMenuCard
            description={ellipsisName(formatted || address) || t('<unknown>')}
            extra='copy'
            onClick={_onCopy}
            position='middle'
            title={t<string>('Address')}
          />
        </CopyToClipboard>
        <EditMenuCard
          description={chain?.name.replace(' Relay Chain', '') || t<string>('Any chain')}
          extra='chevron'
          onClick={goTo(`/account/edit-network/${address}`)}
          position='middle'
          title={t<string>('Network')}
        />
        <EditMenuCard
          description=''
          position='bottom'
          title='Visibility for apps'
          toggle={
            <>
              <Switch
                checked={!account?.isHidden}
                checkedLabel=''
                onChange={_toggleVisibility}
                uncheckedLabel=''
              />
            </>
          }
        />
        {!!master && isExternal === 'false' && canDerive(type) && (
          <EditMenuCard
            description=''
            extra='chevron'
            onClick={goTo(`/account/derive/${address}/locked`)}
            position='both'
            preIcon={
              <Svg
                className='icon'
                src={subAccountIcon}
              />
            }
            title={t<string>('Derive sub-account')}
          />
        )}
        <EditMenuCard
          description=''
          extra='chevron'
          onClick={goTo(`/account/export/${address}`)}
          position='both'
          preIcon={
            <Svg
              className='icon'
              src={exportAccountIcon}
            />
          }
          title={t<string>('Export account')}
        />
        <EditMenuCard
          description=''
          extra='chevron'
          isDanger
          onClick={goTo(`/account/forget/${address}`)}
          position='both'
          preIcon={
            <Svg
              className='forgetIcon'
              src={forgetIcon}
            />
          }
          title={t<string>('Forget')}
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
