import type { ThemeProps } from '../types';

import React from 'react';
import styled from 'styled-components';

import infoIcon from '../assets/information.svg';
import trustedIcon from '../assets/trusted.svg';
import { Svg } from '../components';
import * as LinksList from '../components/LinksList';
import { useGoTo } from '../hooks/useGoTo';
import useTranslation from '../hooks/useTranslation';
import Header from '../partials/Header';

interface Props extends ThemeProps {
  className?: string;
}

function Settings({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { goTo } = useGoTo();

  return (
    <>
      <Header
        goToFnOverride={goTo('/')}
        text={t<string>('Settings')}
        withBackArrow
        withHelp
      />
      <LinksList.Group className={className}>
        <LinksList.Item
          description=''
          onClick={goTo('/auth-list')}
          preIcon={
            <Icon src={trustedIcon} />
          }
          rightIcon='chevron'
          title={t<string>('Trusted Apps')}
        />
        <LinksList.Item
          description=''
          onClick={goTo('/about')}
          preIcon={
            <Icon src={infoIcon} />
          }
          rightIcon='chevron'
          title={t<string>('About Aleph Zero Signer')}
        />
      </LinksList.Group>
    </>
  );
}

export default React.memo(
  styled(Settings)(
    ({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;
  height: calc(100vh - 2px);
  overflow-y: scroll;
  scrollbar-width: none;
  padding-top: 32px;
      
  &::-webkit-scrollbar {
    display: none;
  }
  `
));

const Icon = styled(Svg)`
  width: 20px;
  height: 20px;
  background: ${({ theme }) => theme.primaryColor};
`;
