// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { tagMap } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/predefined';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { MissionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { convertHexColorToRGBA, customFormatDate } from '@subwallet/extension-koni-ui/utils';
import { Icon, Image, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import CN from 'classnames';
import { MagicWand } from 'phosphor-react';
import React, { Context, useCallback, useContext, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & {
  data: MissionInfo,
  onClick: (data: MissionInfo) => void,
};

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

  const tagNode = useMemo(() => {
    if (!data.tags || !data.tags.length) {
      return null;
    }

    const tagSlug = data.tags[0];
    const tagCategory = data?.categories?.[0];
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
          {t(`${name}`)}
        </Tag>
        {
          !!missionStatus && !!missionName && (
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
              {t(`${missionName}`)}
            </Tag>
          )
        }
        {
          tagCategory && (
            <Tag
              className='__item-tag'
              color={tagCategory.color}
            >
              <Icon
                className={'__item-tag-icon'}
                customSize={'12px'}
              />
              {tagCategory.name}
            </Tag>
          )
        }
      </>
    );
  }, [data?.categories, data?.status, data.tags, t]);

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
    '.ant-tag-has-color': {
      backgroundColor: convertHexColorToRGBA(token['gray-6'], 0.1)
    },
    '.__item-tags': {
      display: 'flex'
    },
    '.__item-tag': {
      marginRight: 4,
      display: 'flex',
      flexDirection: 'row',
      gap: 4,
      fontWeight: 700
    },
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
