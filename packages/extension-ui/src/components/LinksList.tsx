// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import chevronIcon from '../assets/chevron.svg';
import copyIcon from '../assets/copyMenu.svg';
import externalLinkIcon from '../assets/externalLink.svg';
import { triggerOnEnterSpace } from '../util/keyDownWrappers';
import Svg from './Svg';

type RightIcon = 'chevron' | 'copy' | 'link';

type Props = {
  preIcon?: React.ReactNode;
  title: string;
  description?: string;
  rightIcon?: RightIcon;
  onClick?: () => void;
  link?: string;
  className?: string,
}

export const Item = ({
  className,
  description,
  link,
  onClick,
  preIcon,
  rightIcon,
  title,
}: Props) => (
  <ItemContainer
    className={className}
    href={link}
    onClick={onClick}
    onKeyDown={triggerOnEnterSpace(onClick)}
    rel='noreferrer'
    target='_blank'
  >
    <Title>
      {preIcon}
      {title}
    </Title>
      {description && (
        <Description>
          {description}
        </Description>
      )}
      {rightIcon && (
        <RightIcon>
          {{
            'chevron': <ChevronIcon src={chevronIcon} />,
            'copy': <CopyIcon src={copyIcon} />,
            'link': <LinkIcon src={externalLinkIcon} />,
          }[rightIcon]}
        </RightIcon>
      )}
  </ItemContainer>
);

const Icon = styled(Svg)`
  fill: ${({ theme }) => theme.primaryColor};
`;

const ChevronIcon = styled(Icon)`
  width: 16px;
  height: 16px;
  background: ${({ theme }) => theme.iconNeutralColor};
`;

const CopyIcon = styled(Icon)`
  width: 16px;
  height: 20px;
  background: ${({ theme }) => theme.iconNeutralColor};
`;

const LinkIcon = styled(Icon)`
  width: 16px;
  height: 16px;
  background: ${({ theme }) => theme.headerIconBackground};
  transition: transform 0.2s ease;
`;

const Title = styled.div`
  display: flex;
  gap: 8px;
  font-family: ${({ theme }) => theme.secondaryFontFamily};
  font-weight: 500;
  font-size: 14px;
  line-height: 145%;
  letter-spacing: 0.07em;
`;

const ItemContainer = styled.a`
  display: flex;
  gap: 14px;
  align-items: center;
  justify-content: space-between;
  text-decoration: none;
  color: inherit;
  padding: 0 16px;
  background: ${({ theme }) => theme.menuBackground};
  height: 48px;
  transition: 0.2s ease;
  cursor: pointer;

  &:hover, &:focus {
    background: ${({ theme }) => theme.editCardBackgroundHover};
    
    ${Icon} {
      background: ${({ theme }) => theme.headerIconBackgroundHover};
    }
  }
`;

export const Group = styled.div`
  &:not(:last-of-type) {
    margin-bottom: 16px;
  }

  ${ItemContainer} {
    border-radius: 2px;
  }

  ${ItemContainer}:last-of-type {
    border-bottom-left-radius: 8px;
    border-bottom-right-radius: 8px;
  }

  ${ItemContainer}:first-of-type {
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }

  ${ItemContainer}:not(:last-of-type) {
    margin-bottom: 2px;
  }
`;

const Description = styled.span`
  flex-grow: 1;
  white-space: nowrap;
  text-overflow: ellipsis;
  overflow: hidden;
  width: 80px;
  text-align: right;
  font-weight: 300;
  font-size: 14px;
  line-height: 145%;
  color: ${({ theme }) => theme.subTextColor};
`;

const RightIcon = styled.div`
  display: flex;
  align-items: center;

  &:hover {
    cursor: pointer
  }
`;