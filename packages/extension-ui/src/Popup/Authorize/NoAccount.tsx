// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { t } from 'i18next';
import React, { useCallback, useEffect } from 'react';
import styled from 'styled-components';

import { approveAuthRequest } from '@polkadot/extension-ui/messaging';

import helpIcon from '../../assets/help.svg';
import { Button, ButtonArea, HelperFooter, Hero, LearnMore, Link, Svg } from '../../components';
import { LINKS } from '../../links';

type Props = {
  authId: string;
};

const CustomFooter = styled(HelperFooter)`
  flex-direction: row;
  display: flex;
  gap: 8px;

  .text-container {
    display: flex;
    gap: 4px;
  }

  .group {
    display: flex;
    gap: 8px;
    justify-content: center;
    align-items: center;
    margin-left: -32px;
  }
`;

function NoAccount({ authId }: Props): React.ReactElement<Props> {
  const approveAuthWithNoAccounts = useCallback(() => approveAuthRequest(authId, []).catch(console.error), [authId]);

  useEffect(() => {
    window.addEventListener('beforeunload', approveAuthWithNoAccounts);

    return () => window.removeEventListener('beforeunload', approveAuthWithNoAccounts);
  }, [approveAuthWithNoAccounts]);

  const onClick = () => {
    approveAuthWithNoAccounts();
    window.close();
  };

  const footer = (
    <CustomFooter>
      <div className='group'>
        <div className='icon-container'>
          <Svg
            className='icon'
            src={helpIcon}
          />
        </div>
        <div className='text-container'>
          <span>
            {t<string>('Only connect with sites you trust.')}&nbsp;
            <br />
            <LearnMore href={LINKS.TRUSTED_APPS} />
          </span>
        </div>
      </div>
    </CustomFooter>
  );

  return (
    <Container>
      <StyledHero
        headerText={t<string>('You do NOT have any account')}
        iconType='warning'
      >
        <Description>
          {t<string>('Please')}&nbsp;
          <StyledLink
            className='link'
            to='/account/add-menu'
          >
            {t<string>('create an account')}
          </StyledLink>
          &nbsp;{t<string>("and refresh the application's page.")}&nbsp;
        </Description>
      </StyledHero>
      <ButtonArea footer={footer}>
        <Button
          className='acceptButton'
          onClick={onClick}
          secondary
        >
          {t<string>('Got it!')}
        </Button>
      </ButtonArea>
    </Container>
  );
}

const Container = styled.div`
  height: 100%;

  display: flex;
  flex-direction: column;
`;

const Description = styled.p`
  margin: 0;
`;

const StyledHero = styled(Hero)`
  margin-block: auto;
`;

const StyledLink = styled(Link)`
  display: inline;

  vertical-align: baseline;

  color: ${({ theme }) => theme.primaryColor};
  cursor: pointer;

  :hover {
    text-decoration: underline;
    color: ${({ theme }) => theme.primaryColor};
  }
`;

export default NoAccount;
