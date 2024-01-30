// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Skeleton, Web3Block } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  direction?: 'vertical' | 'horizontal';
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, direction = 'horizontal' } = props;

  const { token } = useTheme() as Theme;

  return (
    <Web3Block
      className={CN(className)}
      leftItem={(
        <Skeleton.Avatar
          active={true}
          size={token.controlHeightLG}
        />
      )}
      middleItem={(
        <div className={CN('content-wrapper', `direction-${direction}`)}>
          <Skeleton.Input
            active={true}
            block={true}
            className={CN('name', 'content')}
            size='small'
          />
          <Skeleton.Input
            active={true}
            block={true}
            className={CN('address', 'content')}
            size='small'
          />
        </div>
      )}
    />
  );
};

const AccountWithNameSkeleton = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgSecondary,
    padding: token.paddingSM,

    '.content-wrapper': {
      display: 'flex',

      '.content': {
        borderRadius: 0
      },

      '&.direction-horizontal': {
        flexDirection: 'row',
        minHeight: token.controlHeightLG
      },

      '&.direction-vertical': {
        flexDirection: 'column',
        minHeight: token.controlHeightLG
      },

      '.name': {
        fontWeight: token.fontWeightStrong,
        fontSize: token.fontSizeHeading5,
        lineHeight: token.lineHeightHeading5,
        height: token.fontSizeHeading5 * token.lineHeightHeading5
      },
      '.address': {
        fontSize: token.fontSizeSM,
        lineHeight: token.lineHeightSM,
        height: token.fontSizeSM * token.lineHeightSM
      }
    }
  };
});

export default AccountWithNameSkeleton;
