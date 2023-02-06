// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import styled from 'styled-components';

import copyIcon from '../assets/copyMenu.svg';
import { ThemeProps } from '../types';

interface Props extends ThemeProps {
  className?: string;
  preIcon?: React.ReactNode;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'middle' | 'both';
  extra?: 'chevron' | 'copy';
  isDanger?: boolean;
  toggle?: React.ReactNode;
  onClick?: () => void;
}

interface ExtraProps {
  className?: string;
  extra?: 'chevron' | 'copy';
}

const ExtraContent = ({ extra = 'chevron' }: ExtraProps): React.ReactElement<ExtraProps> | null => {
  switch (extra) {
    case 'chevron':
      return <FontAwesomeIcon icon={faChevronRight} />;
    case 'copy':
      return (
        <img
          className='copy-icon'
          src={copyIcon}
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
  position = 'middle',
  preIcon,
  title,
  toggle
}: Props): React.ReactElement<Props> {
  return (
    <div className={className}>
      <div
        className='flex-container'
        onClick={onClick}
      >
        <div className='flex-group'>
          <div className={`title ${isDanger ? 'danger' : ''}`}>
            {preIcon && <div className='icon'>{preIcon}</div>}
            {title}
          </div>
          <div className='description'>
            {description}
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
  border-radius: 8px;
  height: 48px;
  margin-bottom: ${position === 'top' || position === 'middle' ? ' 2px' : '16px'};
  border-radius: ${
    position === 'top'
      ? '8px 8px 2px 2px'
      : position === 'bottom'
      ? '2px 2px 8px 8px'
      : position === 'both'
      ? '8px'
      : '2px'
  };

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

  .icon {
    & img {
      width: 20px;
      height: 20px;
    }
  }

  .danger{
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
  }

  & svg {
    fill: ${theme.primaryColor};
  }

  .extra {
    &:hover {
      cursor: pointer
    };
  }

  .icon {
    display: flex;
  }
`
);
