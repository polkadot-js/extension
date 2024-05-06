// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, CloseIcon, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { useDefaultNavigate } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const FinishIcon = (
  <Icon
    phosphorIcon={CheckCircle}
    weight='fill'
  />
);

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  return (
    <PageWrapper className={CN(className)}>
      <Layout.WithSubHeaderOnly
        onBack={goHome}
        rightFooterButton={{
          children: t('Finish'),
          icon: FinishIcon,
          onClick: goHome
        }}
        subHeaderIcons={[
          {
            icon: <CloseIcon />,
            onClick: goHome
          }
        ]}
        title={t('Successful')}
      >
        <div className='body-container'>
          <div className={CN('notice')}>
            <AlertBox
              description={t('Anyone with your key can use any assets held in your account.')}
              title={t('Warning: Never disclose this key')}
              type='warning'
            />
          </div>
          <div className='result-content'>
            <div className='page-icon'>
              <PageIcon
                color='var(--page-icon-color)'
                iconProps={{
                  phosphorIcon: CheckCircle,
                  weight: 'fill'
                }}
              />
            </div>
            <div className='json-done-tile'>
              {t('Success!')}
            </div>
            <div className='json-done-description'>
              {t('You have successfully export JSON file for your accounts')}
            </div>
          </div>
        </div>
      </Layout.WithSubHeaderOnly>
    </PageWrapper>
  );
};

const ExportAllDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.body-container': {
      padding: `0 ${token.padding}px`
    },

    '.notice': {
      marginTop: token.margin,
      marginBottom: token.margin
    },

    '.result-content': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.size
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      '--page-icon-color': token.colorSecondary
    },

    '.json-done-tile': {
      color: token.colorTextHeading,
      textAlign: 'center',
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3
    },

    '.json-done-description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      color: token.colorTextLabel,
      textAlign: 'center',
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    }
  };
});

export default ExportAllDone;
