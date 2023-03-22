// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import chevronIcon from '../assets/chevron.svg';
import copyIcon from '../assets/copyMenu.svg';
import externalLinkIcon from '../assets/externalLink.svg';
import { ThemeProps } from '../types';
import Svg from './Svg';

type ExtraOptions = 'chevron' | 'copy' | 'link';
interface Props extends ThemeProps {
  className?: string;
  preIcon?: React.ReactNode;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'middle' | 'both';
  extra?: ExtraOptions;
  isDanger?: boolean;
  onClick?: () => void;
  link?: string;
  tabIndex?: number;
}

interface ExtraProps {
  className?: string;
  extra?: ExtraOptions;
  link?: string;
}

const ExtraContent = ({ extra = 'chevron' }: ExtraProps): React.ReactElement<ExtraProps> | null => {
  switch (extra) {
    case 'chevron':
      return (
        <Svg
          className='chevron'
          src={chevronIcon}
        />
      );
    case 'copy':
      return (
        <Svg
          className='copy-icon'
          src={copyIcon}
        />
      );
    case 'link':
      return (
        <Svg
          className='link-icon'
          src={externalLinkIcon}
        />
      );
    default:
      return null;
  }
};

const StyledLink = styled.a`
  text-decoration: none;
  color: inherit;
`;

function EditMenuCard({
  className,
  description,
  extra,
  isDanger = false,
  link,
  onClick,
  preIcon,
  tabIndex = 0,
  title
}: Props): React.ReactElement<Props> {
  return (
    <StyledLink
      href={link}
      rel='noreferrer'
      target='_blank'
    >
      <div
        className={className}
        onClick={onClick}
        onKeyPress={onClick}
        tabIndex={tabIndex}
      >
        <div className='flex-container'>
          <div className='flex-group'>
            <div className={`title ${isDanger ? 'danger' : ''}`}>
              {preIcon}
              {title}
            </div>
            <div className='description'>
              <span
                className={`description-text ${title === 'Address' ? 'address' : title === 'Network' ? 'network' : ''}`}
              >
                {description}
              </span>
              <div className='extra'>
                <ExtraContent
                  extra={extra}
                  link={link}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledLink>
  );
}

export default styled(EditMenuCard)(
  ({ link, onClick, position, theme }: Props) => `
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0px 16px;
  background: ${theme.menuBackground};
  height: 48px;
  margin-bottom: ${position === 'top' || position === 'middle' ? ' 2px' : '16px'};
  margin-top: ${position === 'both' ? '16px' : '0px'};
  border-radius: ${
    position === 'top'
      ? '8px 8px 2px 2px'
      : position === 'bottom'
      ? '2px 2px 8px 8px'
      : position === 'both'
      ? '8px'
      : '2px'
  };
  transition: 0.2s ease;

  &:hover {
    background: ${theme.editCardBackgroundHover};

    ${Svg}:not(.icon):not(.forgetIcon) {
      background: ${theme.headerIconBackgroundHover};
    }

    .forgetIcon {
      background: ${theme.buttonBackgroundDangerHover};
    }

    .danger {
      color: ${theme.buttonBackgroundDangerHover};
    }
    
  
    .chevron {
      background: ${theme.headerIconBackgroundHover};
    }

    .link-icon {
      transform: translateX(4px);
    }
  }

  cursor: ${onClick || link ? 'pointer' : 'default'};

  .chevron {
    width: 16px;
    height: 16px;
    background: ${theme.iconNeutralColor};
  }

  .flex-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 28px;
    width: 100%;
  }

  .flex-group {
    display: flex;
    gap: 4px;
    align-content: flex-start;
    align-items: center;
    justify-content: space-between;
    width: 100%;
  }

  .danger {
    color: ${theme.textColorDanger};
  }

  .title {
    display: flex;
    gap: 8px;
    font-family: ${theme.secondaryFontFamily};
    font-weight: 500;
    font-size: 14px;
    line-height: 145%;
    letter-spacing: 0.07em;
    }

  .description {
    display: flex;
    font-weight: 300;
    font-size: 14px;
    line-height: 145%;
    max-width: 230px;
    white-space: pre-line;
    gap: 14px;
    color: ${theme.subTextColor};

    .description-text {
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      width: 80px;
      text-align: right;
    }

    .description-text.address {
      width: 150px;
    }

    .description-text.network {
      width: 120px;
    }
  }

  .icon, .forgetIcon {
    width: 20px;
    height: 20px;
  }

  .icon {
    background: ${theme.primaryColor};
  }

  .forgetIcon {
    background: ${theme.iconDangerColor};
  }

  & svg {
    fill: ${theme.primaryColor};
  }

  .extra {
    display: flex;
    align-items: center;

    &:hover {
      cursor: pointer
    }
  }

  .copy-icon {
    width: 16px;
    height: 20px;
    background: ${theme.iconNeutralColor};
  }

  .link-icon {
    width: 20px;
    height: 20px;
    background: ${theme.primaryColor};
    transition: transform 0.2s ease;
  }

  .icon {
    display: flex;
  }
`
);
