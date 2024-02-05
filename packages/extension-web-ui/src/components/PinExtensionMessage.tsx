// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LanguageType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { useSelector } from '@subwallet/extension-web-ui/hooks';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon as SwIcon, Image, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { PushPinSimple, PuzzlePiece } from 'phosphor-react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

type IconProps = Pick<SwIconProps, 'phosphorIcon'>;

const Icon: React.FC<IconProps> = (props: IconProps) => {
  const { phosphorIcon } = props;

  return (
    <SwIcon
      className='custom-icon'
      phosphorIcon={phosphorIcon}
      size='sm'
      weight='fill'
    />
  );
};

const specialLanguages: LanguageType[] = ['ja'];

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const { language } = useSelector((state) => state.settings);

  return (
    <div className={CN(className, { 'special-language': specialLanguages.includes(language) })}>
      <div className='message-header'>
        <div className='message-image'>
          <Image
            height='var(--img-height)'
            shape='square'
            src='/images/subwallet/gradient-logo.png'
          />
        </div>
        <div className='message-content'>
          {t('Pin SubWallet to toolbar for easier access')}
        </div>
      </div>
      <div className='message-sub-content'>
        <Trans
          components={{
            extension: <Icon phosphorIcon={PuzzlePiece} />,
            pin: (
              <Icon phosphorIcon={PushPinSimple} />
            )
          }}
          i18nKey={detectTranslate('Click <extension/> select SubWallet and then <pin/>')}
        />
      </div>
    </div>
  );
};

const PinExtensionMessage = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    width: token.sizeXL * 10,
    borderRadius: token.borderRadiusLG,
    padding: `${token.padding}px ${token.paddingXL - 2}px`,
    borderWidth: token.lineWidth,
    borderStyle: token.lineType,
    borderColor: '#333333', // TODO: Need add color to UI lib
    backgroundColor: token.colorTextDark2,

    '.message-header': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: token.size
    },

    '.message-image': {
      '--img-height': token.sizeXL
    },

    '.message-content': {
      fontSize: token.fontSizeHeading5,
      lineHeight: token.lineHeightHeading5
    },

    '.message-sub-content': {
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6,
      marginTop: token.marginSM
    },

    '.custom-icon': {
      verticalAlign: '-0.15em'
    },

    '&.special-language': {
      padding: token.paddingLG,
      width: token.sizeXL * 12.5,

      '.message-sub-content': {
        textAlign: 'end'
      }
    }
  };
});

export default PinExtensionMessage;
