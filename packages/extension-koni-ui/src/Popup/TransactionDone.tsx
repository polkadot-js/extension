// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CloseIcon, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { useDefaultNavigate } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { PageIcon } from '@subwallet/react-ui';
import { CheckCircle } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import reformatAddress from '../utils/account/reformatAddress';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
  const { address, chain, transactionId } = useParams<{address: string, chain: string, transactionId: string}>();

  const { t } = useTranslation();
  const navigate = useNavigate();
  const { goHome } = useDefaultNavigate();

  const viewInHistory = useCallback(
    () => {
      if (address && chain && transactionId) {
        navigate(`/home/history/${reformatAddress(address)}/${chain}/${transactionId}`, { state: { from: 'ignoreRemind' } });
      } else {
        navigate('/home/history');
      }
    },
    [chain, transactionId, navigate, address]
  );

  return (
    <PageWrapper className={className}>
      <Layout.WithSubHeaderOnly
        leftFooterButton={{
          block: true,
          onClick: viewInHistory,
          children: t('View transaction')
        }}
        rightFooterButton={{
          block: true,
          onClick: goHome,
          children: t('Back to home')
        }}
        subHeaderLeft={<CloseIcon />}
        title={t('Submitted')}
      >
        <div className='container'>
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
            {t('Transaction submitted!')}
          </div>
          <div className='description'>
            {t('Track transaction progress in the History tab or go back to home')}
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const TransactionDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

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
