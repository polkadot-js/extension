// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@subwallet/extension-koni-ui/constants/common';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { ArrowCircleRight, CheckCircle, DiscordLogo, PaperPlaneTilt, TwitterLogo, X } from 'phosphor-react';
import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Layout } from '../components';
import SocialGroup from '../components/SocialGroup';
import { ScreenContext } from '../contexts/ScreenContext';

type Props = ThemeProps;

enum SocialType {
  TWITTER = 'twitter',
  DISCORD = 'discord',
  TELEGRAM = 'telegram',
}

interface SocialItem {
  icon: PhosphorIcon;
  type: SocialType;
  url: string;
}

const items: SocialItem[] = [
  {
    icon: TwitterLogo,
    type: SocialType.TWITTER,
    url: TWITTER_URL
  },
  {
    icon: DiscordLogo,
    type: SocialType.DISCORD,
    url: DISCORD_URL
  },
  {
    icon: PaperPlaneTilt,
    type: SocialType.TELEGRAM,
    url: TELEGRAM_URL
  }
];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { goHome } = useDefaultNavigate();
  const { isWebUI } = useContext(ScreenContext);

  const { t } = useTranslation();

  return (
    <Layout.Base
      {...(!isWebUI ? {
        rightFooterButton: {
          children: t('Go to home'),
          onClick: goHome,
          icon: <Icon
            phosphorIcon={ArrowCircleRight}
            weight={'fill'}
          />
        },
        showBackButton: true,
        subHeaderPaddingVertical: true,
        showSubHeader: true,
        subHeaderCenter: true,
        subHeaderBackground: 'transparent'
    }: {
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
      })}>
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
          {t('Follow along with product updates or reach out if you have any questions.')}
        </div>

        {isWebUI && (
          <Button
            onClick={goHome}
            icon={<Icon
              phosphorIcon={ArrowCircleRight}
              weight={'fill'}
            />}
            style={{
              width: '100%',
              marginBottom: 80
            }}
          >
            {t('Go to Porfolio')}
          </Button>
        )}
        <SocialGroup />
      </div>
    </Layout.Base>
  );
};

const CreatePasswordDone = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    textAlign: 'center',

    '&.__web-ui': {
      maxWidth: '50%',
      margin: '0 auto',
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

    '.button-group': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: token.size
    },

    [`.type-${SocialType.TWITTER}`]: {
      backgroundColor: token['blue-7'],

      '&:hover': {
        backgroundColor: token['blue-8']
      }
    },

    [`.type-${SocialType.DISCORD}`]: {
      backgroundColor: token['geekblue-8'],

      '&:hover': {
        backgroundColor: token['geekblue-9']
      }
    },

    [`.type-${SocialType.TELEGRAM}`]: {
      backgroundColor: token['blue-5'],

      '&:hover': {
        backgroundColor: token['blue-6']
      }
    }
  };
});

export default CreatePasswordDone;
