// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import helpIcon from '../assets/help.svg';
import {
  AccountContext,
  ActionContext,
  Address,
  Button,
  ButtonArea,
  HelperFooter,
  Hero,
  LearnMore,
  Svg
} from '../components';
import useToast from '../hooks/useToast';
import useTranslation from '../hooks/useTranslation';
import { LINKS } from '../links';
import { forgetAccount } from '../messaging';
import { Header } from '../partials';

type Props = RouteComponentProps<{ address: string }>;

const StyledAddress = styled(Address)`
  .name {
    width: 150px;
  }
`;

function Forget({
  match: {
    params: { address }
  }
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const { accounts } = useContext(AccountContext);
  const [isBusy, setIsBusy] = useState(false);
  const { show } = useToast();

  const account = accounts.find((account) => account.address === address);

  const isExternal = account?.isExternal || 'false';

  const _goTo = useCallback((path: string) => () => onAction(path), [onAction]);

  const _onClick = useCallback((): void => {
    setIsBusy(true);
    forgetAccount(address)
      .then(() => {
        setIsBusy(false);
      })
      .catch((error: Error) => {
        setIsBusy(false);
        console.error(error);
      });
    show(t<string>('Account forgotten'), 'success');
    onAction('/');
  }, [address, onAction, show, t]);

  const CustomFooter = styled(HelperFooter)`
  .wrapper {
    display: flex;
    gap: 8px;
    margin-left: -12px;
  }`;

  const footer = (
    <CustomFooter>
      <div className='wrapper'>
        <Svg
          className='icon'
          src={helpIcon}
        />
        <span>
          {t<string>('How to restore your account?')}&nbsp;
          <LearnMore href={LINKS.FORGET} />
        </span>
      </div>
    </CustomFooter>
  );

  return (
    <>
      <Header
        text={t<string>('Forget account')}
        withBackArrow
        withHelp
      />
      <ContentContainer>
        <StyledHero
          headerText={t<string>('Forget account')}
          iconType='forget'
        >
          <Text>
            {t<string>(
              'Even though you can remove account from Aleph Zero Signer, you can restore it here or in another wallet with the secret phrase. '
            )}
          </Text>
          <Text>{t<string>('Not sure if you have it? You can export JSON file and use it as well.')}</Text>
        </StyledHero>
        <StyledAddress
          address={address}
          withExport
        />
      </ContentContainer>
      <ButtonArea footer={footer}>
        <Button
          isDisabled={isBusy}
          onClick={_goTo(`/account/edit-menu/${address}?isExternal=${isExternal.toString()}`)}
          secondary
        >
          {t<string>('Cancel')}
        </Button>
        <Button
          isDanger
          onClick={_onClick}
        >
          {t<string>('Forget')}
        </Button>
      </ButtonArea>
    </>
  );
}

const ContentContainer = styled.div`
  margin-bottom: auto;
  margin-top: 32px;
`;

const StyledHero = styled(Hero)`
  margin-bottom: 16px;
`;

const Text = styled.p`
  margin: 0;

  :not(:last-child) {
    margin-bottom: 16px;
  }
`;

export default withRouter(Forget);
