// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Button, Logo } from '@subwallet/react-ui';
import { SizeType } from '@subwallet/react-ui/es/config-provider/SizeContext';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  symbol: string;
  token: string;
  size?: SizeType;
  disable?: boolean;
  available?: boolean;
  active?: boolean;
}

const Component: React.FC<Props> = (props: Props) => {
  const { active, available, className, disable, size = 'xs', symbol } = props;

  const { t } = useTranslation();

  const _borderRadius = useMemo(() => {
    if (size === 'xs') {
      return '20px';
    } else if (size === 'sm') {
      return '24px';
    } else if (size === 'md') {
      return '26px';
    }

    return '32px';
  }, [size]);

  return (
    <Button
      block={false}
      className={CN(className, { active, disable: disable || !available })}
      disabled={disable}
      icon={(
        <Logo
          className={'earning-btn-icon'}
          size={16}
          token={symbol.toLowerCase()}
        />
      )}
      shape={'round'}
      size={size}
      style={{ borderRadius: _borderRadius }}
      tooltip={!available ? t('Coming soon') : ''}
      type={'ghost'}
    >
      {symbol}
    </Button>
  );
};

const EarningBtn = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    width: 'fit-content',
    borderWidth: token.lineWidth,
    borderStyle: token.lineType,
    borderColor: token.colorBgBorder,

    '&.ant-btn.-size-xs': {
      height: 30,
      minHeight: 30,
      padding: `0 ${token.paddingSM}px`
    },

    '.ant-btn-content-wrapper': {
      fontWeight: 600
    },

    '&.active': {
      backgroundColor: token.colorBgBorder
    },

    '&:hover': {
      backgroundColor: token.colorBgSecondary,
      borderColor: token.colorBgSecondary,
    },

    '&.disable': {
      backgroundColor: token.colorTransparent,
      cursor: 'not-allowed',

      '&:hover': {
        backgroundColor: token.colorTransparent,
        borderColor: token.colorBgBorder
      }
    },

    '.earning-btn-icon': {
      paddingRight: token.paddingXXS,

      '.ant-image-img': {
        marginBottom: '2px'
      }
    }
  };
});

export default EarningBtn;
