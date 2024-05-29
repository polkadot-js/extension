// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MissionCategoryType } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/predefined';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { MissionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { customFormatDate } from '@subwallet/extension-koni-ui/utils';
import { Icon, Image, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import { SwIconProps } from '@subwallet/react-ui/es/icon';
import CN from 'classnames';
import { CheckCircle, Coin, Cube, DiceSix, MagicWand, MegaphoneSimple, SelectionBackground, User } from 'phosphor-react';
import { IconWeight } from 'phosphor-react/src/lib';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  data: MissionInfo,
  onClick: (data: MissionInfo) => void,
};

enum TagType {
  FCFS='fcfs',
  POINTS='points',
  LUCKY_DRAW='lucky_draw',
  MANUAL_SELECTION='manual_selection'
}

type TagInfo = {
  theme: string,
  name: string,
  slug: string,
  icon: SwIconProps['phosphorIcon'],
  iconWeight?: IconWeight
}

function Component (props: Props): React.ReactElement<Props> {
  const { className, data, onClick } = props;
  const { t } = useTranslation();
  const logoMap = useContext<Theme>(ThemeContext as Context<Theme>).logoMap;

  const timeline = useMemo<string>(() => {
    if (!data.start_time && !data.end_time) {
      return t('TBD');
    }

    const start = data.start_time ? customFormatDate(new Date(data.start_time), '#DD# #MMM# #YYYY#') : t('TBD');
    const end = data.end_time ? customFormatDate(new Date(data.end_time), '#DD# #MMM# #YYYY#') : t('TBD');

    return `${start} - ${end}`;
  }, [data.end_time, data.start_time, t]);

  const onClickContainer = useCallback(() => {
    onClick(data);
  }, [data, onClick]);

  const tagMap = useMemo<Record<string, TagInfo>>(() => {
    return {
      [TagType.FCFS]: {
        theme: 'yellow',
        name: t('FCFS'),
        slug: TagType.FCFS,
        icon: User
      },
      [TagType.POINTS]: {
        theme: 'success',
        name: t('Points'),
        slug: TagType.POINTS,
        icon: Coin,
        iconWeight: 'fill'
      },
      [TagType.LUCKY_DRAW]: {
        theme: 'gold',
        name: t('Lucky draw'),
        slug: TagType.LUCKY_DRAW,
        icon: DiceSix,
        iconWeight: 'fill'
      },
      [TagType.MANUAL_SELECTION]: {
        theme: 'blue',
        name: t('Manual selection'),
        slug: TagType.MANUAL_SELECTION,
        icon: SelectionBackground
      },
      [MissionCategoryType.UPCOMING]: {
        theme: 'gray',
        name: t('Upcoming'),
        slug: MissionCategoryType.UPCOMING,
        icon: MegaphoneSimple,
        iconWeight: 'fill'
      },
      [MissionCategoryType.LIVE]: {
        theme: 'success',
        name: t('Live'),
        slug: MissionCategoryType.LIVE,
        icon: CheckCircle,
        iconWeight: 'fill'
      },
      [MissionCategoryType.ARCHIVED]: {
        theme: 'blue',
        name: t('Archived'),
        slug: MissionCategoryType.ARCHIVED,
        icon: Cube,
        iconWeight: 'fill'
      }
    };
  }, [t]);

  const tagNode = useMemo(() => {
    if (!data.tags || !data.tags.length) {
      return null;
    }

    const tagSlug = data.tags[0];
    const theme = tagMap[tagSlug]?.theme || 'gray';
    const name = tagMap[tagSlug]?.name || t(capitalize(tagSlug.replace('_', ' ')));
    const iconWeight = tagMap[tagSlug]?.iconWeight;
    const icon = tagMap[tagSlug]?.icon || MagicWand;
    let missionTheme, missionName, missionIconWeight, missionIcon;
    const missionStatus = data?.status;

    if (missionStatus) {
      missionTheme = tagMap[missionStatus]?.theme || 'gray';
      missionName = tagMap[missionStatus]?.name;
      missionIconWeight = tagMap[missionStatus]?.iconWeight;
      missionIcon = tagMap[missionStatus]?.icon;
    }

    return (
      <>
        <Tag
          className='__item-tag'
          color={theme}
        >
          <Icon
            className={'__item-tag-icon'}
            customSize={'12px'}
            phosphorIcon={icon}
            weight={iconWeight}
          />
          {name}
        </Tag>
        {
          missionStatus && (
            <Tag
              className='__item-tag'
              color={missionTheme}
            >
              <Icon
                className={'__item-tag-icon'}
                customSize={'12px'}
                phosphorIcon={missionIcon}
                weight={missionIconWeight}
              />
              {missionName}
            </Tag>
          )
        }
      </>
    );
  }, [data.tags, data.status, t, tagMap]);

  return (
    <div
      className={CN(className)}
      onClick={onClickContainer}
    >

      <div className={'__item-inner'}>
        <div
          className='__item-background'
          style={{ backgroundImage: data.backdrop_image ? `url("${data.backdrop_image}")` : undefined }}
        ></div>
        <div
          className='__item-logo'
        >
          <Image
            height={40}
            shape={'squircle'}
            src={data.logo || logoMap.default as string}
            width={40}
          />
        </div>
        <div className={'__right-block'}>
          <div className='__item-name'>
            {data.name || ''}
          </div>
          <div className={'__item-timeline'}>{timeline}</div>
          <div className={'__item-rewards'}>
            <div className='__item-label'>{t('Rewards')}:&nbsp;</div>
            <div className='__item-value'>
              {data.reward}
            </div>
          </div>
          <div className='__separator'></div>
          <div className={'__item-tags'}>
            {tagNode}
          </div>
        </div>
      </div>
    </div>
  );
}

const MissionItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    cursor: 'pointer',
    position: 'relative',
    padding: token.sizeSM,
    paddingTop: token.paddingXS,
    paddingBottom: token.paddingXS,
    overflow: 'hidden',
    '.__item-inner': {
      display: 'flex',
      alignItems: 'center',
      gap: token.sizeSM
    },
    '.__right-block': {
      overflow: 'hidden',
      flex: 1
    },
    '.__item-name': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.fontWeightStrong,
      color: token.colorWhite
    },
    '.__item-timeline, .__item-rewards': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextTertiary,
      fontWeight: token.bodyFontWeight
    },
    '.__item-rewards': {
      display: 'flex'
    },
    '.__separator': {
      height: 2,
      backgroundColor: 'rgba(33, 33, 33, 0.80)',
      marginTop: token.marginXS,
      marginBottom: token.marginXS
    },
    '.__item-rewards .__item-value': {
      color: token.colorSuccess,
      fontWeight: token.headingFontWeight,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap'
    },

    '.__item-background': {
      height: '100%',
      width: 32,
      backgroundPosition: 'left',
      backgroundSize: 'cover',
      position: 'absolute',
      top: 0,
      left: 4,
      filter: 'blur(8px)'
    }
  };
});

export default MissionItem;
