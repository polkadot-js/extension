// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TabHeaderItemType } from '@subwallet/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  item: TabHeaderItemType;
  isActivated: boolean;
  onSelect: (tabId: number) => void;
}

function getContainerClassName (isActivated: boolean, extraClassName = ''): string {
  let className = `tab-header-item ${extraClassName}`;

  if (isActivated) {
    className += ' -activated ';
  }

  return className;
}

function TabHeaderItem ({ className, isActivated, item, onSelect }: Props): React.ReactElement<Props> {
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
        <div className={'tab-header-item__icon'}>
          {item.icon}
        </div>
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

  .tab-header-item__icon {
    height: 26px;
    width: auto;
    color: ${theme.textColor2};
  }

  .tab-header-item__label {
    font-size: 13px;
    line-height: 20px;
    color: ${theme.textColor2};
    font-weight: 400;
    padding-top: 3px;
  }
  
  &.-activated {
    .tab-header-item__icon {
      color: ${theme.HomeNavHighlightColor};
    }
    .tab-header-item__content-wrapper:before {
      background-color: ${theme.HomeNavHighlightColor};    
    }
  }
`);
