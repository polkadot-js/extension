// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertBox, CloseIcon, Layout } from '@subwallet/extension-web-ui/components';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useDefaultNavigate } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { CheckCircle } from 'phosphor-react';
import React, { useContext } from 'react';
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
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();
  const { goHome } = useDefaultNavigate();

  return (
    <Layout.WithSubHeaderOnly
      onBack={goHome}
      rightFooterButton={
        !isWebUI
          ? {
            children: t('Finish'),
            icon: FinishIcon,
            onClick: goHome
          }
          : undefined}
      subHeaderIcons={[
        {
          icon: <CloseIcon />,
          onClick: goHome
        }
      ]}
      title={t('Successful')}
    >
      <div className={CN(className, 'body-container')}>
        <div className={'notice'}>
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
        {
          isWebUI && (
            <div className={'__button-wrapper'}>
              <Button
                block={true}
                className={'__button'}
                icon={(
                  <Icon
                    phosphorIcon={CheckCircle}
                    weight='fill'
                  />
                )}
                onClick={goHome}
                schema={'primary'}
              >
                {t('Finish')}
              </Button>
            </div>
          )
        }
      </div>
    </Layout.WithSubHeaderOnly>
  );
};

const ExportAllDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '.body-container': {
      padding: `0 ${token.padding}px`
    },

    '.__button-wrapper': {
      paddingTop: 64
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

    '.title': {
      marginTop: token.margin,
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextBase
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginTop: token.controlHeightLG,
      marginBottom: token.margin,
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
      marginTop: token.margin,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.web-ui-enable &': {
      maxWidth: '416px',
      paddingLeft: token.padding,
      paddingRight: token.padding,
      margin: '0 auto',

      '.page-icon': {
        marginTop: 0
      },

      '.title': {
        marginTop: 0
      },

      '.description': {
        marginTop: 0
      }
    }
  };
});

export default ExportAllDone;
