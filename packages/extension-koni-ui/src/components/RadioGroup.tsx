// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Radio, RadioGroupProps } from '@subwallet/react-ui';
import React from 'react';
import styled from 'styled-components';

type Props = ThemeProps & RadioGroupProps;

const Component: React.FC<Props> = (props: Props) => {
  return (
    <Radio.Group {...props} />
  );
};

const RadioGroup = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '&.ant-radio-group': {
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      padding: token.paddingXXS,
      borderRadius: token.borderRadiusLG,
      background: token.colorBgSecondary,

      '.ant-radio-button-wrapper': {
        flex: 1,
        textAlign: 'center',
        borderRadius: token.borderRadiusLG,
        border: 'none',
        borderColor: token.colorTransparent,
        padding: '5px 8px',
        fontSize: token.fontSize,
        lineHeight: token.lineHeight,
        fontWeight: token.fontWeightStrong,
        background: token.colorBgSecondary,
        color: token.colorText,

        '&:before': {
          content: 'none'
        }
      },

      '.ant-radio-button-wrapper-checked': {
        background: token.colorBgInput
      }
    }
  };
});

export default RadioGroup;
