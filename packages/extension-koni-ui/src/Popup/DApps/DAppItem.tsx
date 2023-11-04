// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import NetworkGroup from '@subwallet/extension-koni-ui/components/MetaInfo/parts/NetworkGroup';
import { DAPPS_FAVORITE } from '@subwallet/extension-koni-ui/constants';
import { DEFAULT_DAPPS_FAVORITE } from '@subwallet/extension-koni-ui/constants/dapps';
import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DAppInfo } from '@subwallet/extension-koni-ui/types/dapp';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Image, Tag } from '@subwallet/react-ui';
import capitalize from '@subwallet/react-ui/es/_util/capitalize';
import CN from 'classnames';
import { Star } from 'phosphor-react';
import React, { Context, useCallback, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & DAppInfo & {
  compactMode?: boolean
};

function Component (props: Props): React.ReactElement<Props> {
  const { categories, categoryMap, chains,
    className = '', compactMode, description, icon, id, subtitle,
    title, url } = props;
  const { t } = useTranslation();
  const [dAppsFavorite, setDAppsFavorite] = useLocalStorage(DAPPS_FAVORITE, DEFAULT_DAPPS_FAVORITE);
  const logoMap = useContext<Theme>(ThemeContext as Context<Theme>).logoMap;

  const onClickStar = useCallback((event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setDAppsFavorite((prevState) => ({
      ...prevState,
      [id]: !prevState[id]
    }));
  }, [setDAppsFavorite, id]);

  const isStared = dAppsFavorite[id];

  if (compactMode) {
    return (
      <div
        className={CN(className, '-compact-mode', { '-is-stared': isStared })}
        onClick={openInNewTab(url)}
      >
        <Image
          height={'100%'}
          src={icon || logoMap.default as string}
          width={'100%'}
        />
        <div className={'__item-title-group'}>
          <div className={'__item-title-wrapper'}>
            <div className='__item-title'>
              {title}
            </div>

            {
              !!categories && !!categories.length && (
                <div className='__item-tags-area'>
                  {categories.map((c) => (
                    <Tag
                      className='__item-tag'
                      color={categoryMap[c]?.color || 'gray'}
                      key={c}
                    >
                      {t(categoryMap[c]?.name || capitalize(c))}
                    </Tag>
                  ))}
                </div>
              )
            }
          </div>
          <div className='__item-subtitle'>
            {subtitle}
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
    );
  }

  return (
    <div
      className={CN(className, '-normal-mode', { '-is-stared': isStared })}
      onClick={openInNewTab(url)}
    >
      <div className={'__item-header'}>
        <Image
          height={'100%'}
          src={icon || logoMap.default as string}
          width={'100%'}
        />
        <div className={'__item-title-group'}>
          <div className='__item-title'>
            {title}
          </div>
          <div className='__item-subtitle'>
            {subtitle}
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
        {
          !!categories && !!categories.length && (
            <div className='__item-tags-area'>
              {categories.map((c) => (
                <Tag
                  className='__item-tag'
                  color={categoryMap[c]?.color || 'gray'}
                  key={c}
                >
                  {t(categoryMap[c]?.name || capitalize(c))}
                </Tag>
              ))}
            </div>
          )
        }
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
    overflow: 'hidden',
    cursor: 'pointer',

    '&.-normal-mode': {
      padding: token.padding,
      backgroundColor: token.colorBgSecondary,
      borderRadius: token.borderRadiusLG
    },

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
    '.__item-tags-area': {
      display: 'flex',
      gap: token.sizeXS
    },
    '.__item-tag': {
      marginRight: 0
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

    '&.-normal-mode:hover': {
      backgroundColor: token.colorBgInput
    },

    // compact

    '&.-compact-mode': {
      display: 'flex',
      overflow: 'hidden',
      gap: token.sizeXS,
      alignItems: 'center',

      '.ant-image': {
        width: 44,
        height: 44,
        minWidth: 44
      },

      '.__item-title-wrapper': {
        display: 'flex',
        alignItems: 'center',
        gap: token.sizeXS
      },

      '.__item-tags-area': {
        gap: token.sizeXXS
      }
    }
  };
});

export default DAppItem;
