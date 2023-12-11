// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import CloseIcon from '@subwallet/extension-koni-ui/components/Icon/CloseIcon';
import { useDefaultNavigate } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';

import SocialGroup from '../components/SocialGroup';
import { ScreenContext } from '../contexts/ScreenContext';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { address, chain, transactionId } = useParams<{address: string, chain: string, transactionId: string}>();
  const { isWebUI } = useContext(ScreenContext);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const viewInHistory = useCallback(
    () => {
      if (address && chain && transactionId) {
        navigate(`/home/history/${address}/${chain}/${transactionId}`);
      } else {
        navigate('/home/history');
      }
    },
    [chain, transactionId, navigate, address]
  );

  return (
    <Layout.WithSubHeaderOnly
      {...(!isWebUI
        ? {
          leftFooterButton: {
            block: true,
            onClick: viewInHistory,
            children: t('View transaction')
          },
          rightFooterButton: {
            block: true,
            onClick: goHome,
            children: t('Back to home')
          },
          subHeaderLeft: <CloseIcon />
        }
        : {}
      )}
      title={t('Successful')}
    >
      <div className={CN(className, {
        '__web-ui': isWebUI
      })}
      >
        <div className='page-icon'>
          <PageIcon
            color='var(--page-icon-color)'
            iconProps={{
              weight: 'fill',
              phosphorIcon: CheckCircle
            }}
          />
        </div>
        <div className='title'>
          {t('All done!')}
        </div>
        <div className='description'>
          {t('Your request has been sent. You can track its progress in History tab.')}
        </div>
        <SocialGroup />
        {isWebUI && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            width: '80%',
            margin: '0 auto'
          }}
          >
            <Button
              {...{
                block: true,
                schema: 'secondary',
                onClick: viewInHistory,
                children: t('View transaction')
              }}
            />
            <Button
              {...{
                block: true,
                onClick: goHome,
                children: t('Back to home')
              }}
            />
          </div>
        )}
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const TransactionDone = styled(Component)<Props>(({ theme: { extendToken, token } }: Props) => {
  return {
    textAlign: 'center',

    '&.__web-ui': {
      textAlign: 'center',
      width: extendToken.oneColumnWidth,
      margin: '0 auto'
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.controlHeightLG,
      marginBottom: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextBase
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      marginTop: token.margin,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.and-more': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,

      '.highlight': {
        color: token.colorTextBase
      }
    },

    '.ant-sw-screen-layout-footer-button-container': {
      flexDirection: 'column',
      padding: `0 ${token.padding}px`,
      gap: token.size,

      '.ant-btn': {
        margin: 0
      }
    }
  };
});

export default TransactionDone;
