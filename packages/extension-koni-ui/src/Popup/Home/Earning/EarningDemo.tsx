// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WIKI_URL } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { ButtonProps, Icon, SwSubHeader } from '@subwallet/react-ui';
import { Question } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { EarningOverviewContent } from './parts';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { setOnBack, setTitle } = useContext(WebUIContext);
  const location = useLocation();

  const onBack = useCallback(() => {
    navigate('/crowdloan-unlock-campaign/check-contributions');
  }, [navigate]);

  useEffect(() => {
    if (location.pathname === '/earning-demo') {
      setTitle(t('Earning pools'));
    }
  }, [location.pathname, setTitle, t]);

  useEffect(() => {
    setOnBack(onBack);

    return () => {
      setOnBack(undefined);
    };
  }, [onBack, setOnBack]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={Question}
            type='phosphor'
            weight={'fill'}
          />
        ),
        onClick: openInNewTab(WIKI_URL)
      }
    ];
  }, []);

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={'__header-area'}
            onBack={onBack}
            paddingVertical
            rightButtons={headerIcons}
            showBackButton
            title={t('Earning pools')}
          />)
      }

      <div className={'__body-area'}>
        <EarningOverviewContent className={'earning-overview-content'} />
      </div>
    </div>
  );
};

const EarningDemo = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    '.__body-area': {
      overflow: 'auto',
      flex: 1,
      width: '100%',
      alignSelf: 'center',
      paddingLeft: 166,
      paddingRight: 166
    },

    '@media (max-width: 1200px)': {
      '.__body-area': {
        paddingLeft: 44,
        paddingRight: 44
      }
    },

    '@media (max-width: 991px)': {
      '.__body-area': {
        paddingLeft: 0,
        paddingRight: 0
      },

      '.earning-overview-content': {
        paddingLeft: token.size,
        paddingRight: token.size,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'auto',
        height: '100%'
      },

      '.__list-container': {
        flex: 1
      }
    }
  });
});

export default EarningDemo;
