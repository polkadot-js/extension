// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { noop } from '@subwallet/extension-koni-ui/utils';
import { Image } from '@subwallet/react-ui';
import CN from 'classnames';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import styled from 'styled-components';

interface Props extends ThemeProps {
  content: string;
}

const onClickHyperLink = (href?: string) => {
  return (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    e.preventDefault();
    window.open(href);
  };
};

const Component = ({ className, content }: Props) => {
  return (
    <ReactMarkdown
      className={className}
      components={{
        img (props) {
          const { children, className, node, src, ...rest } = props;

          return (
            <Image
              {...rest}
              className={'custom-img'}
              onClick={noop}
              src={src}
              width={'100%'}
            />
          );
        },
        blockquote (props) {
          const { children, ...rest } = props;

          return (
            <blockquote
              {...rest}
              className={'custom-blockquote'}
            >
              {children}
            </blockquote>
          );
        },
        hr (props) {
          return (
            <hr
              {...props}
              className={'custom-hr'}
            />
          );
        },
        ul (props) {
          return (
            <ul
              {...props}
              className={'custom-ul'}
            ></ul>
          );
        },
        body (props) {
          return (
            <body
              {...props}
              className={'custom-body'}
            ></body>
          );
        },
        p (props) {
          const { children, className, ...rest } = props;

          return (
            <p
              {...rest}
              className={CN([className, 'custom-paragraph'])}
            >{children}</p>
          );
        },
        a (props) {
          const { children, className, href, ...rest } = props;

          return (
            <a
              {...rest}
              onClick={onClickHyperLink(href)}
            >{children}</a>
          );
        }
      }}
      remarkPlugins={[gfm]}
    >{content}</ReactMarkdown>
  );
};

const ContentGenerator = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.custom-body': {
      color: token.colorWhite,
      fontSize: token.fontSizeSM,
      lineHeight: token.fontSizeSM * token.lineHeightSM,
      fontFamily: 'PlusJakartaSans-Medium'
    },
    '.custom-blockquote': {
      backgroundColor: token.colorBgSecondary,
      borderColor: 'transparent',
      borderLeftWidth: 0,
      marginLeft: 0,
      paddingLeft: 12,
      paddingRight: 12,
      borderRadius: token.borderRadiusLG,
      paddingTop: 4,
      paddingBottom: 4,
      marginTop: 4,
      marginBottom: 4,
      display: 'inline-block'
    },
    '.custom-hr': {
      backgroundColor: token.colorBgBorder,
      height: 2,
      marginTop: 4,
      marginBottom: 4,
      border: 'none'
    },
    '.custom-ul': {
      paddingInlineStart: 24,
      marginBottom: 0
    },
    '.custom-img': {
      marginTop: 4,
      marginBottom: 4
    },
    '.custom-paragraph': {
      marginTop: 4,
      marginBottom: 4
    }
  };
});

export default ContentGenerator;
