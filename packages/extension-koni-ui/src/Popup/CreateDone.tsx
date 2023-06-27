// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, X } from 'phosphor-react';
import React, {useContext} from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Layout, SocialButtonGroup } from '../components';
import {ScreenContext} from "@subwallet/extension-koni-ui/contexts/ScreenContext";

type Props = ThemeProps;

const Component: React.FC<Props> = (props: Props) => {
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
        <div className={CN('title', {
          '__web-ui': isWebUI
        })}
        >
          {!isWebUI ? t('All done!') : t("You're all done!")}
        </div>
        <div className={CN('description', {
          '__web-ui': isWebUI
        })}
        >
          {t('Follow along with product updates or reach out if you have any questions.')}
        </div>
        <SocialButtonGroup />
      </div>
    </Layout.Base>
  );
};

const CreateDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '&.__web-ui': {
      maxWidth: '400px',
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
      textAlign: 'center',
      '&.__web-ui': {
        padding: `0 ${token.controlHeightLG}px`
      }
    }
  };
});

export default CreateDone;
