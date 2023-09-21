// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Icon, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { ChartBar, Coin, GlobeHemisphereWest, Image, ListBullets, MagnifyingGlass, RocketLaunch, SlidersHorizontal, Trophy } from 'phosphor-react';
import React, { useMemo } from 'react';
import styled from 'styled-components';

import { PhosphorIcon, ThemeProps } from '../types';

export enum PAGE_TYPE {
  NFT_COLLECTION = 'nft_collection',
  NFT_COLLECTION_DETAIL = 'nft_collection_detail',
  TOKEN = 'token',
  SEARCH = 'search',
  CROWDLOANS = 'crowdloans',
  HISTORY = 'history',
  STAKING = 'staking',
  STATISTIC = 'statistic',
  DAPPS = 'dapps'
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
      [PAGE_TYPE.NFT_COLLECTION]: {
        icon: Image,
        title: t('No collectible found'),
        content: t('Your collectibles will appear here')
      },
      [PAGE_TYPE.NFT_COLLECTION_DETAIL]: {
        icon: Image,
        title: t('No NFT collectible'),
        content: t('Your NFT collectible will appear here!')
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
      },
      [PAGE_TYPE.DAPPS]: {
        icon: GlobeHemisphereWest,
        title: t('No dApps found'),
        content: t('Your dApps will show up here')
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
    paddingTop: 48,
    paddingBottom: 88,
    display: 'flex',
    alignItems: 'center',

    '.message-wrapper': {
      maxWidth: 358,
      width: '100%',
      paddingLeft: token.padding,
      paddingRight: token.padding,
      paddingTop: token.padding,
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.message-icon': {
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      fontSize: 64,
      position: 'relative',
      width: 112,
      height: 112,
      marginLeft: 'auto',
      marginRight: 'auto',

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
        textAlign: 'center'
      }
    }
  };
});

export default NoContent;
