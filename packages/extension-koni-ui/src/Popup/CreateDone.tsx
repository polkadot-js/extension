// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, Wallet, X } from 'phosphor-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Layout, SocialButtonGroup } from '../components';
import useAutoNavigateToCreatePassword from '../hooks/router/useAutoNavigateToCreatePassword';

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
  useAutoNavigateToCreatePassword();
  const { className } = props;

  const { goHome } = useDefaultNavigate();
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();

  return (
    <Layout.Base
      {...(!isWebUI
        ? {
          rightFooterButton: {
            children: t('Go to home'),
            onClick: goHome,
            icon: (
              <Icon
                phosphorIcon={ArrowCircleRight}
                weight={'fill'}
              />
            )
          },
          showBackButton: true,
          subHeaderPaddingVertical: true,
          showSubHeader: true,
          subHeaderCenter: true,
          subHeaderBackground: 'transparent'
        }
        : {
          headerList: ['Simple'],
          showWebHeader: true
        })}
      showBackButton={true}
      subHeaderLeft={(
        <Icon
          phosphorIcon={X}
          size='md'
        />
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
        <div className={CN('title')}
        >
          {!isWebUI ? t('All done!') : t("You're all done!")}
        </div>
        <div className={CN('description')}
        >
          {t('Follow along with product updates or reach out if you have any questions.')}
        </div>
        <SocialButtonGroup />

        <div className={'__button-wrapper'}>
          <Button
            block={true}
            className={'__button'}
            icon={(
              <Icon
                phosphorIcon={Wallet}
                weight='fill'
              />
            )}
            onClick={goHome}
            schema={'primary'}
          >
            {t('Go to portfolio')}
          </Button>
        </div>
      </div>
    </Layout.Base>
  );
};

const CreateDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '&.__web-ui': {
      maxWidth: '416px',
      paddingLeft: token.padding,
      paddingRight: token.padding,
      margin: '0 auto'
    },

    '.page-icon': {
      display: 'flex',
      justifyContent: 'center',
      marginBottom: token.margin,
      '--page-icon-color': token.colorSecondary
    },

    '.title': {
      marginBottom: token.margin,
      fontWeight: token.fontWeightStrong,
      fontSize: token.fontSizeHeading3,
      lineHeight: token.lineHeightHeading3,
      color: token.colorTextBase
    },

    '.description': {
      padding: `0 ${token.controlHeightLG - token.padding}px`,
      marginBottom: token.margin * 2,
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5,
      color: token.colorTextDescription,
      textAlign: 'center'
    },

    '.__button-wrapper': {
      paddingTop: 64
    }
  };
});

export default CreateDone;
