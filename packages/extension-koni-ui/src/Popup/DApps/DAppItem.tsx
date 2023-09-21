// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import NetworkGroup from '@subwallet/extension-koni-ui/components/MetaInfo/parts/NetworkGroup';
import { DAPPS_FAVORITE } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_DAPPS_FAVORITE } from '@subwallet/extension-koni-ui/constants/dapps';
import { dAppCategoryMap, DAppInfo } from '@subwallet/extension-koni-ui/Popup/DApps/predefined';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Image, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import CN from 'classnames';
import { Star } from 'phosphor-react';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & DAppInfo;

function Component (props: Props): React.ReactElement<Props> {
  const { categories, chains,
    className = '', description, icon, id, name,
    subTitle, url } = props;
  const { t } = useTranslation();
  const [dAppsFavorite, setDAppsFavorite] = useLocalStorage(DAPPS_FAVORITE, DEFAULT_DAPPS_FAVORITE);

  const onClickStar = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDAppsFavorite((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  }, [setDAppsFavorite, id]);

  const isStared = dAppsFavorite[id];

  return (
    <div
      className={CN(className, { '-is-stared': isStared })}
      onClick={openInNewTab(url)}
    >
      <div className={'__item-header'}>
        <Image
          className={CN('__item-logo')}
          height={'100%'}
          src={icon}
          width={'100%'}
        />
        <div className={'__item-title-group'}>
          <div className='__item-title'>
            {name}
          </div>
          <div className='__item-subtitle'>
            {subTitle}
          </div>
        </div>
        <Button
          className={CN('__star-button', {
            '-active': isStared
          })}
          icon={(
            <Icon
              phosphorIcon={Star}
              size='sm'
              weight={isStared ? 'fill' : undefined}
            />
          )}
          onClick={onClickStar}
          size={'xs'}
          type='ghost'
        />
      </div>
      <div className={'__item-description'}>
        {description}
      </div>
      <div className={'__item-footer'}>
        <div className='__item-tags-area'>
          {categories.map((c) => (
            <Tag
              className='__item-tag'
              color={dAppCategoryMap[c]?.theme || 'gray'}
              key={c}
            >
              {t(dAppCategoryMap[c]?.name || capitalize(c))}
            </Tag>
          ))}
        </div>
        {
          !!chains && !!chains.length && (
            <div className='__item-chains-area'>
              <NetworkGroup chains={chains} />
            </div>
          )
        }
      </div>
    </div>
  );
}

const DAppItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    padding: token.padding,
    overflow: 'hidden',
    backgroundColor: token.colorBgSecondary,
    borderRadius: token.borderRadiusLG,
    cursor: 'pointer',

    '.__item-header': {
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeXS,
      alignItems: 'center',
      marginBottom: token.marginSM,

      '.ant-image': {
        width: 38,
        height: 38,
        minWidth: 38
      }
    },
    '.__item-title, .__item-subtitle': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      'white-space': 'nowrap'
    },
    '.__item-title-group': {
      flex: 1,
      overflow: 'hidden'
    },
    '.__item-title': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorTextLight1
    },
    '.__item-subtitle': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3
    },
    '.__item-description': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3,
      display: '-webkit-box',
      '-webkit-line-clamp': '3',
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden',
      marginBottom: token.marginSM
    },
    '.__item-footer': {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    '.__star-button': {
      '&.-active': {
        color: token['yellow-6']
      },
      '&.-active:hover': {
        color: token['yellow-7']
      }
    },

    '&:hover': {
      backgroundColor: token.colorBgInput
    }
  };
});

export default DAppItem;
