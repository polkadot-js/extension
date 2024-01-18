// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon } from '@subwallet/react-ui';
import { SwIconProps } from '@subwallet/react-ui/es/icon';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps{
  iconProps: SwIconProps;
  backgroundColor?: string;
  colorThemeToken?: string;
}

const Component: React.FC<Props> = (props: Props) => {
  const { backgroundColor, className, iconProps } = props;

  return (
    <>
      <div
        className={CN(className, 'box-icon')}
        style={{ backgroundColor: backgroundColor }}
      >
        <Icon
          size={'md'}
          weight={'fill'}
          {...iconProps}
        />
      </div>
    </>
  );
};

const ContentBoxIcon = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    borderRadius: '100%',
    width: token.sizeXL,
    height: token.sizeXL,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  });
});

export default ContentBoxIcon;
