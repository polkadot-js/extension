// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Theme, ThemeProps } from '@subwallet/extension-web-ui/types';
import { Button, ButtonProps, PageIcon } from '@subwallet/react-ui';
import CN from 'classnames';
import { IconProps } from 'phosphor-react';
import React from 'react';
import styled, { useTheme } from 'styled-components';

interface Props extends ThemeProps {
  phosphorIcon?: React.ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>,
  emptyTitle?: string,
  emptyMessage?: string | React.ReactNode,
  buttonProps?: ButtonProps;
}

const Component: React.FC<Props> = (props: Props) => {
  const { buttonProps, className, emptyMessage, emptyTitle, phosphorIcon } = props;
  const { token } = useTheme() as Theme;

  return (
    <div className={CN(className, 'empty-list')}>
      <div className={'empty-list-inner'}>
        <div className={'empty_icon_wrapper'}>
          <PageIcon
            color={token['gray-4']}
            iconProps={{
              phosphorIcon,
              weight: 'fill'
            }}
          />
        </div>

        <div className={'empty_text_container'}>
          <div className={'empty_title'}>{emptyTitle}</div>
          <div className={'empty_subtitle'}>{emptyMessage}</div>
        </div>

        {
          buttonProps && (
            <div className='button-container'>
              <Button {...buttonProps} />
            </div>
          )
        }
      </div>
    </div>
  );
};

const EmptyList = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    overflow: 'auto',
    marginTop: 32,
    marginBottom: 32,
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    flexDirection: 'column',

    '&:before, &:after': {
      content: '""',
      display: 'block',
      flex: '1 1 0'
    },

    '.empty-list-inner': {
      width: '100%',
      display: 'flex',
      gap: token.padding,
      flexDirection: 'column',
      alignContent: 'center',
      padding: token.padding,
      marginLeft: 'auto',
      marginRight: 'auto'
    },

    '.empty_text_container': {
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      justifyContent: 'center',
      flexWrap: 'wrap',
      whiteSpace: 'pre-line'
    },

    '.empty_title': {
      fontWeight: token.headingFontWeight,
      textAlign: 'center',
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      color: token.colorText
    },

    '.empty_subtitle': {
      textAlign: 'center',
      color: token.colorTextTertiary,
      fontSize: token.fontSizeHeading6,
      lineHeight: token.lineHeightHeading6
    },

    '.empty_icon_wrapper': {
      display: 'flex',
      justifyContent: 'center'
    },

    '.button-container': {
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
});

export default EmptyList;
