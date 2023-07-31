import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useMemo } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import { Identicon } from '@polkadot/extension-ui/components';
import useMetadata from '@polkadot/extension-ui/hooks/useMetadata';
import { IconTheme } from '@polkadot/react-identicon/types';

import exportAccountIcon from '../../assets/export.svg';
import subAccountIcon from '../../assets/subAccount.svg';
import forgetIcon from '../../assets/vanish.svg';
import { Svg } from '../../components';
import { AccountContext, SettingsContext } from '../../components/contexts';
import * as LinksList from '../../components/LinksList';
import { useGoTo } from '../../hooks/useGoTo';
import useToast from '../../hooks/useToast';
import useTranslation from '../../hooks/useTranslation';
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

  const { show } = useToast();

  const searchParams = new URLSearchParams(search);
  const isExternal = searchParams.get('isExternal');

  const account = useMemo(() => accounts.find((account) => account.address === address), [accounts, address]);

  const chain = useMetadata(account?.genesisHash, true);

  const type = chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE;

  const settings = useContext(SettingsContext);

  const prefix = chain ? chain.ss58Format : settings.prefix === -1 ? 42 : settings.prefix;

  const theme = (account && account.type === 'ethereum' ? 'ethereum' : chain?.icon || 'polkadot') as IconTheme;

  const _onCopy = useCallback(() => show(t<string>('Public address copied to your clipboard'), 'success'), [show, t]);

  const { goTo } = useGoTo();

  const { account: recodedAccount, formatted } = useMemo(
    () => recodeAddress(address, accounts, chain, settings),
    [accounts, address, chain, settings]
  );

  return (
    <>
      <Header
        goToFnOverride={goTo('/')}
        text={t<string>('Edit Account')}
        withBackArrow
        withHelp
      />
      <div className={className}>
        <Identicon
          className='identityIcon'
          iconTheme={theme}
          isExternal={isExternal === 'true'}
          prefix={prefix}
          value={formatted || recodedAccount?.address}
        />
        <LinksList.Group>
          <LinksList.Item
            description={account?.name || ''}
            onClick={goTo(`/account/edit-name/${address}`)}
            rightIcon='chevron'
            title={t<string>('Name')}
          />
          <CopyToClipboard text={(address && address) || ''}>
            <LinksList.Item
              description={ellipsisName(formatted || address) || t('<unknown>')}
              onClick={_onCopy}
              rightIcon='copy'
              title={t<string>('Address')}
            />
          </CopyToClipboard>
          <LinksList.Item
            description={chain?.name.replace(' Relay Chain', '') || t<string>('Any chain')}
            onClick={goTo(`/account/edit-network/${address}`)}
            rightIcon='chevron'
            title={t<string>('Network')}
          />
          <LinksList.Item
            onClick={goTo(`/account/change-password/${address}`)}
            rightIcon='chevron'
            title={t<string>('Change password')}
          />
        </LinksList.Group>
        {!!master && isExternal === 'false' && canDerive(type) && (
          <LinksList.Group>
            <LinksList.Item
              onClick={goTo(`/account/derive/${address}/locked`)}
              preIcon={
                <Svg
                  className='icon'
                  src={subAccountIcon}
                />
              }
              rightIcon='chevron'
              title={t<string>('Derive sub-account')}
            />
          </LinksList.Group>
        )}
        <LinksList.Group>
          <LinksList.Item
            onClick={goTo(`/account/export/${address}`)}
            preIcon={
              <Svg
                className='icon'
                src={exportAccountIcon}
              />
            }
            rightIcon='chevron'
            title={t<string>('Export account')}
          />
        </LinksList.Group>
        <LinksList.Group>
          <ForgetListItem
            onClick={goTo(`/account/forget/${address}`)}
            preIcon={
              <ForgetIcon src={forgetIcon} />
            }
            rightIcon='chevron'
            title={t<string>('Forget')}
          />
        </LinksList.Group>
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
  padding-top: 32px;
      
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

const ForgetIcon = styled(Svg)`
  width: 20px;
  height: 20px;
  background: ${({ theme }) => theme.iconDangerColor};
`;

const ForgetListItem = styled(LinksList.Item)`
  color: ${({ theme }) => theme.textColorDanger};
  
  &:hover, &:focus {
    color: ${({ theme }) => theme.buttonBackgroundDangerHover};
    
    ${ForgetIcon} {
      background: ${({ theme }) => theme.buttonBackgroundDangerHover};
    }
  }
`;