// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WIKI_URL } from '@subwallet/extension-koni-ui/constants';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { HeaderType, WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useAutoNavigateEarning, useGetYieldPositions, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { ButtonProps, Icon, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { Question } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { EarningOverviewContent } from './parts';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { setHeaderType } = useContext(WebUIContext);

  const yieldPositions = useGetYieldPositions();
  const { setTitle } = useContext(WebUIContext);

  useAutoNavigateEarning();

  const onBack = useCallback(() => {
    navigate('/home/earning/detail');
  }, [navigate]);

  useEffect(() => {
    if (yieldPositions.length) {
      setHeaderType(HeaderType.COMMON_BACK);
    } else {
      setHeaderType(HeaderType.COMMON);
    }
  }, [setHeaderType, yieldPositions.length]);

  useEffect(() => {
    if (location.pathname.startsWith('/home/earning')) {
      setTitle(t('Earning'));
    }
  }, [setTitle, t]);

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
    <div
      className={className}
    >
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={CN('__header-area', {
              '-no-back': !yieldPositions.length
            })}
            onBack={onBack}
            rightButtons={headerIcons}
            showBackButton={!!yieldPositions.length}
            title={t('Earning')}
          />)
      }

      <div className={'__body-area'}>
        <EarningOverviewContent />
      </div>
    </div>
  );
};

const EarningOverview = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',

    '.__header-area.-no-back': {
      '.ant-sw-header-center-part': {
        marginLeft: token.size
      },

      '.ant-sw-sub-header-center-part-pl': {
        textAlign: 'left',
        paddingLeft: 0
      }
    },

    '.__body-area': {
      overflow: 'auto',
      flex: 1,
      width: '100%',
      alignSelf: 'center'
    },

    '@media (max-width: 991px)': {
      '.__body-area': {
        paddingLeft: token.size,
        paddingRight: token.size
      }
    }
  });
});

export default EarningOverview;
