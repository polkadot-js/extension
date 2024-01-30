// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DISCORD_URL, TELEGRAM_URL, TWITTER_URL } from '@subwallet/extension-web-ui/constants';
import { PhosphorIcon, ThemeProps } from '@subwallet/extension-web-ui/types';
import { openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Button, Icon } from '@subwallet/react-ui';
import CN from 'classnames';
import { DiscordLogo, PaperPlaneTilt, TwitterLogo } from 'phosphor-react';
import React from 'react';
import styled from 'styled-components';

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

  return (
    <div className={CN(className, 'button-group')}>
      {
        items.map((item) => (
          <Button
            className={CN(`type-${item.type}`)}
            icon={(
              <Icon
                phosphorIcon={item.icon}
                weight='fill'
              />
            )}
            key={item.type}
            onClick={openInNewTab(item.url)}
            shape='squircle'
          />
        ))
      }
    </div>
  );
};

const SocialButtonGroup = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.button-group': {
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

export default SocialButtonGroup;
