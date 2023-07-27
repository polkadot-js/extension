// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { detectTranslate } from '@subwallet/extension-base/utils';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon as SwIcon, Image, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { PushPinSimple, PuzzlePiece } from 'phosphor-react';
import React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

interface IconProps extends Pick<SwIconProps, 'phosphorIcon'> {
  last?: boolean;
}

const Icon: React.FC<IconProps> = (props: IconProps) => {
  const { last, phosphorIcon } = props;

  return (
    <span>
      &nbsp;
      <SwIcon
        phosphorIcon={phosphorIcon}
        size='sm'
        weight='fill'
      />
      {!last && <span>&nbsp;</span>}
    </span>
  );
};

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();

  return (
    <div className={CN(className)}>
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
              <Icon
                last={true}
                phosphorIcon={PushPinSimple}
              />
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
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: token.marginSM
    }
  };
});

export default PinExtensionMessage;
