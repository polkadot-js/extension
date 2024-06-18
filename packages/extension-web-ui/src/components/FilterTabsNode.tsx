// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

export type FilterTabItemType = {
  label: string,
  value: string,
  icon: SwIconProps['phosphorIcon'],
  iconColor: string,
}

type Props = ThemeProps & {
  items: FilterTabItemType[],
  selectedItem: string,
  onSelect: (value: string) => void,
};

function Component ({ className = '', items, onSelect, selectedItem }: Props): React.ReactElement<Props> {
  console.log('items reactNode', items);
  const onClick = useCallback((value: string) => {
    return () => {
      onSelect(value);
    };
  }, [onSelect]);

  return (
    <div className={className}>
      {
        items.map((i) => (
          <div
            className={CN('__tab-item', {
              '-active': i.value === selectedItem
            })}
            key={i.value}
            onClick={onClick(i.value)}
            tabIndex={-1}
          >
            <Icon
              phosphorIcon={i.icon}
              iconColor={i.iconColor}
              customSize={'16px'}
            />
            <div className={'__tab-item-label'}>
              {i.label}
            </div>
          </div>
        ))
      }
    </div>
  );
}

export const FilterTabsNode = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    display: 'flex',
    gap: token.sizeXS,
    maxHeight: 30,

    '.__tab-item': {
      cursor: 'pointer',
      color: token.colorTextLight4,
      transition: `color ${token.motionDurationMid}`,
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      paddingTop: 4,
      paddingRight: 12,
      paddingLeft: 12,
      paddingBottom: 4,
      borderRadius: 50,
      borderStyle: 'solid',
      borderColor: token.colorBorder,
      borderWidth: 2
    },

    '.__tab-item-label': {
      fontSize: token.fontSizeLG,
      lineHeight: token.lineHeightLG,
      fontWeight: token.headingFontWeight,
      'white-space': 'nowrap'
    },

    '.__tab-item:after': {
      content: "''",
      display: 'block',
      borderTopWidth: 2,
      borderTopStyle: 'solid',
      transition: `opacity ${token.motionDurationMid}`,
      opacity: 0
    },

    '.__tab-item.-active': {
      color: token.colorTextLight2,

      '&:after': {
        opacity: 1
      }
    }
  };
});
