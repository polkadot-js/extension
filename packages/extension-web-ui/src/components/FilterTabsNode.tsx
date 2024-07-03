// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { Icon, SwIconProps } from '@subwallet/react-ui';
import CN from 'classnames';
import { IconWeight } from 'phosphor-react/src/lib';
import React, { useCallback } from 'react';
import styled from 'styled-components';

export type FilterTabItemType = {
  label: string,
  value: string,
  icon: SwIconProps['phosphorIcon'],
  iconColor: string,
  weight?: IconWeight,
}

type Props = ThemeProps & {
  items: FilterTabItemType[],
  selectedItem: string,
  onSelect: (value: string) => void,
};

function Component ({ className = '', items, onSelect, selectedItem }: Props): React.ReactElement<Props> {
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
              customSize={'16px'}
              iconColor={i.iconColor}
              phosphorIcon={i.icon}
              weight={i.weight ?? undefined}
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
    marginBottom: 20,

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
      borderColor: token.colorBgBorder,
      borderWidth: 2
    },
    '.-active': {
      backgroundColor: token['gray-2']
    },

    '.__tab-item-label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      fontWeight: token.fontWeightStrong,
      color: token.colorTextTertiary,
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
