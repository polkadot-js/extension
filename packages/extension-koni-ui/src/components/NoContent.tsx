// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ChartBar, Coin, Image, ListBullets, MagnifyingGlass, RocketLaunch, SlidersHorizontal, Trophy } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { PhosphorIcon, ThemeProps } from '../types';

export enum PAGE_TYPE {
  NFT = 'nft',
  TOKEN = 'token',
  SEARCH = 'search',
  CROWDLOANS = 'crowdloans',
  HISTORY = 'history',
  STAKING = 'staking',
  STATISTIC = 'statistic',
}

type Props = ThemeProps & {
  pageType: PAGE_TYPE
  className?: string
}

type PageContent = {
  title: string
  icon: PhosphorIcon
  content: string
  button?: {
    label: string
    icon: PhosphorIcon
  }
}

const Component: React.FC<Props> = ({ className, pageType }: Props) => {
  const { t } = useTranslation();

  const pageContents = useMemo<Record<string, PageContent>>(() => {
    return {
      [PAGE_TYPE.NFT]: {
        icon: Image,
        title: t('No collectible found'),
        content: t('Your collectibles will appear here')
      },
      [PAGE_TYPE.TOKEN]: {
        icon: Coin,
        title: t('No token found'),
        content: t('Your token will appear here')
      },
      [PAGE_TYPE.SEARCH]: {
        icon: MagnifyingGlass,
        title: t('No results found'),
        content: t('Please change your search criteria and try again'),
        button: {
          label: t('Manage token list'),
          icon: SlidersHorizontal
        }
      },
      [PAGE_TYPE.CROWDLOANS]: {
        icon: RocketLaunch,
        title: t('You’ve not participated in any crowdloans'),
        content: t('Your crowdloans portfolio will appear here')
      },
      [PAGE_TYPE.HISTORY]: {
        icon: ListBullets,
        title: t('No transaction yet'),
        content: t('Your transaction history will appear here')
      },
      [PAGE_TYPE.STAKING]: {
        icon: Trophy,
        title: t('No staking'),
        content: t('Your staking accounts will appear here')
      },
      [PAGE_TYPE.STATISTIC]: {
        icon: ChartBar,
        title: t('There is no data'),
        content: t('The data will automatically appear when your portfolio has assets')
      }
    };
  }, [t]);

  const { content, icon, title } = pageContents[pageType];

  return (
    <div className={CN(className)}>
      <div className={CN('message-wrapper')}>
        <div className='message-icon'>
          <Icon
            iconColor='#737373'
            phosphorIcon={icon}
            weight='fill'
          />
          <div className='shape' />
        </div>

        <div className={CN('flex-col', 'message-content')}>
          <Typography.Title className='title'>{title}</Typography.Title>
          {content && (
            <Typography.Text className='content'>{content}</Typography.Text>
          )}
        </div>
      </div>
    </div>
  );
};

const NoContent = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: '100%',

    '.message-wrapper': {
      height: '100%',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '50px 0 50px',

      '.message-icon': {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 60,
        height: 'fit-content',
        width: 'fit-content',
        padding: '28px',
        position: 'relative',

        '.anticon': {
          position: 'relative',
          zIndex: 10
        },

        '.shape': {
          opacity: 0.1,
          background: '#4D4D4D',
          borderRadius: '50%',
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          right: 0
        }
      },

      '.message-content': {
        marginTop: 16,
        justifyContent: 'center',
        alignItems: 'center',
        display: 'flex',
        flexDirection: 'column',

        '& > *': {
          margin: 0
        },

        '.title': {
          fontSize: 16,
          lineHeight: '24px'
        },

        '.content': {
          fontSize: 14,
          lineHeight: '22px',
          color: token.colorTextLight4,
          maxWidth: 326,
          textAlign: 'center'
        }
      }
    },

    '.action-button': {
      opacity: 0.45
    }
  };
});

export default NoContent;
