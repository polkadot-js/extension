// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IconDefinition } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon, FontAwesomeIconProps } from '@fortawesome/react-fontawesome';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  icon?: IconDefinition;
  iconProps?: Omit<FontAwesomeIconProps, 'icon'>;
  onClick?: () => void;
  onClickIcon?: () => void;
  renderIcon?: () => JSX.Element;
  value: string;
}

const TextField = ({ className, icon, iconProps, onClick, onClickIcon, renderIcon, value }: Props) => {
  return (
    <div
      className={CN(className, { clickable: !!onClick })}
      onClick={onClick}
    >
      <div className={CN('text-content')}>
        {value}
      </div>
      {
        renderIcon
          ? (
            <div
              className={CN('icon-container')}
              onClick={onClickIcon}
            >
              { renderIcon() }
            </div>
          )
          : (
            icon && (
              <div
                className={CN('icon-container')}
                onClick={onClickIcon}
              >
                <FontAwesomeIcon
                  icon={icon}
                  {... iconProps}
                />
              </div>
            )
          )
      }
    </div>
  );
};

export default React.memo(styled(TextField)(({ theme }: Props) => `
  display: flex;
  flex-direction: row;
  padding: 12px 16px;
  background: #262C4A;
  border-radius: 8px;
  justify-content: space-between;
  align-items: center;

  &.clickable {
    cursor: pointer;
  }

  .text-content {
    font-style: normal;
    font-weight: 400;
    font-size: 14px;
    line-height: 24px;
    color: ${theme.textColor2};
    text-overflow: ellipsis;
    overflow: hidden;
  }

  .icon-container {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-left: 12px;
    cursor: pointer;
  }

`));
