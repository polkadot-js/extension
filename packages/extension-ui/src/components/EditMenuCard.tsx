// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

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
  toggle?: React.ReactNode;
  onClick?: () => void;
}

interface ExtraProps {
  className?: string;
  extra?: ExtraOptions;
}

const ExtraContent = ({ extra = 'chevron' }: ExtraProps): React.ReactElement<ExtraProps> | null => {
  switch (extra) {
    case 'chevron':
      return (
        <FontAwesomeIcon
          className='chevron'
          icon={faChevronRight}
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

function EditMenuCard({
  className,
  description,
  extra,
  isDanger = false,
  onClick,
  preIcon,
  title,
  toggle
}: Props): React.ReactElement<Props> {
  return (
    <div
      className={className}
      onClick={onClick}
    >
      <div className='flex-container'>
        <div className='flex-group'>
          <div className={`title ${isDanger ? 'danger' : ''}`}>
            {preIcon}
            {title}
          </div>
          <div className='description'>
            <span className='description-text'>{description}</span>
            {toggle && <div className='extra'>{toggle}</div>}
            {!toggle && (
              <div className='extra'>
                <ExtraContent extra={extra} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default styled(EditMenuCard)(
  ({ onClick, position, theme }: Props) => `
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

  &:hover {
    ${Svg}:not(.icon):not(.forgetIcon) {
      background: ${theme.headerIconBackgroundHover};
    }
  
    .chevron path{
      fill: ${theme.headerIconBackgroundHover};
    }
  }

  cursor: ${onClick ? 'pointer' : 'default'};

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
      width: 75px;
      text-align: right;
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
  }

  .icon {
    display: flex;
  }
`
);
