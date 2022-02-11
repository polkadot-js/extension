// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { TabHeaderItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  item: TabHeaderItemType;
  isActivated: boolean;
  isDarkTheme: boolean;
  onSelect: (tabId: number) => void;
}

function getImgSrc (item: TabHeaderItemType, isActivated: boolean, isDarkTheme: boolean): string {
  if (isDarkTheme) {
    return isActivated ? item.activatedDarkIcon : item.darkIcon;
  } else {
    return isActivated ? item.activatedLightIcon : item.lightIcon;
  }
}

function getContainerClassName (isActivated: boolean, extraClassName = ''): string {
  let className = `tab-header-item ${extraClassName}`;

  if (isActivated) {
    className += ' -activated ';
  }

  return className;
}

function TabHeaderItem ({ className, isActivated, isDarkTheme, item, onSelect }: Props): React.ReactElement<Props> {
  const _onSelect = (tabId: number) => {
    return (e: React.MouseEvent<HTMLElement>) => {
      onSelect(tabId);
    };
  };

  return (
    <div
      className={getContainerClassName(isActivated, className)}
      onClick={_onSelect(item.tabId)}
    >
      <div className='tab-header-item__content-wrapper'>
        <img
          alt='Icon'
          className={'tab-header-item__icon'}
          src={getImgSrc(item, isActivated, isDarkTheme)}
        />

        <div className='tab-header-item__label'>{item.label}</div>
      </div>
    </div>
  );
}

export default styled(TabHeaderItem)(({ theme }: Props) => `
  display: flex;
  justify-content: center;
  cursor: pointer;

  .tab-header-item__content-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    position: relative;
    padding: 12px 4px;
  }

  .tab-header-item__content-wrapper:before {
    content: '';
    bottom: 100%;
    height: 2px;
    position: absolute;
    background: transparent;
    left: 0;
    right: 0;
  }

  &.-activated .tab-header-item__content-wrapper:before {
    background: #42C59A;
  }

  .tab-header-item__icon {
    height: 26px;
    width: auto;
  }

  .tab-header-item__label {
    font-size: 13px;
    line-height: 20px;
    color: ${theme.textColor2};
    font-weight: 400;
    padding-top: 3px;
  }
`);
