// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DAppInfo } from '@subwallet/extension-koni-ui/types/dapp';
import { openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Button, Icon, Image } from '@subwallet/react-ui';
import CN from 'classnames';
import { GlobeHemisphereWest } from 'phosphor-react';
import React, { Context, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps & DAppInfo & {
  compactMode?: boolean
};

function Component (props: Props): React.ReactElement<Props> {
  const { className = '', compactMode, description, icon, preview_image: previewImage, subtitle,
    title, url } = props;

  const logoMap = useContext<Theme>(ThemeContext as Context<Theme>).logoMap;

  const { t } = useTranslation();

  if (compactMode) {
    return (
      <div
        className={CN(className, '-compact-mode')}
        onClick={openInNewTab(url)}
      >
        <div
          className={'__item-preview-area'}
          style={{ backgroundImage: previewImage ? `url("${previewImage}")` : undefined }}
        >
        </div>
      </div>
    );
  }

  return (
    <div
      className={CN(className)}
      onClick={openInNewTab(url)}
    >
      <div
        className={'__item-preview-area'}
        style={{ backgroundImage: previewImage ? `url("${previewImage}")` : undefined }}
      >
        <div className='__item-overlay'>
          <Button
            className={'__button'}
            icon={(
              <Icon
                phosphorIcon={GlobeHemisphereWest}

                size={'sm'}
                weight='fill'
              />
            )}
            shape={'circle'}
            size={'xs'}
          >
            {t('Launch app')}
          </Button>
        </div>
      </div>
      <div className={'__item-meta-area'}>
        <div className={'__item-meta-header'}>
          <Image
            className={CN('__item-logo')}
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
        </div>
        <div className={'__item-description'}>
          {description}
        </div>
      </div>
    </div>
  );
}

const FeatureDAppItem = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    overflow: 'hidden',
    borderRadius: token.borderRadiusLG,
    cursor: 'pointer',

    '.__item-preview-area': {
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      position: 'relative',

      '&:before': {
        content: '""',
        display: 'block',
        paddingTop: `${1 / 3 * 100}%`
      }
    },

    '.__item-overlay': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      opacity: 0,
      transition: 'opacity 0.2s ease',
      inset: 0,
      position: 'absolute'
    },

    '.__item-meta-area': {
      padding: token.padding,
      paddingTop: 10,
      backgroundColor: token.colorBgSecondary,
      transition: 'backgroundColor 0.2s ease'
    },

    '.__item-meta-header': {
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
      '-webkit-line-clamp': '2',
      '-webkit-box-orient': 'vertical',
      overflow: 'hidden',
      height: token.fontSizeSM * token.lineHeightSM * 2
    },

    '&:hover': {
      '.__item-overlay': {
        opacity: 1
      },

      '.__item-meta-area': {
        backgroundColor: token.colorBgInput
      }
    }
  };
});

export default FeatureDAppItem;
