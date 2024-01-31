// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import { GeneralProps, SortDirection, TableColumnType, TableSortInfo, ThemeProps } from '../../types';

interface Props<T> extends GeneralProps {
  columns: TableColumnType<T>[],
  setSortInfo?: (sortInfo: TableSortInfo) => void;
  sortInfo?: TableSortInfo;
}

const Component = <T, >({ className, columns, setSortInfo, sortInfo }: Props<T>) => {
  const onSort = useCallback((col: TableColumnType<T>) => {
    if (!setSortInfo || !sortInfo || !col.sortable) {
      return () => {};
    }

    return () => {
      let direction: SortDirection = 'asc';

      if (sortInfo?.colKey === col.key) {
        if (sortInfo?.direction === 'asc') {
          direction = 'desc';
        } else if (sortInfo?.direction === 'desc') {
          direction = null;
        }
      }

      setSortInfo?.({ colKey: col.key, direction });
    };
  }, [setSortInfo, sortInfo]);

  return (
    <div className={CN(className, '__thead')}>
      {
        columns.map((col) => {
          return (
            <div
              className={CN('__th', col.className, {
                '-sortable': col.sortable && sortInfo
              })}
              key={col.key}
              onClick={onSort(col)}
            >
              <div className={'__th-inner'}>
                <div className='__th-content-wrapper'>
                  <div className='__th-content'>
                    <div className='__col-title'>
                      {col.title}
                    </div>

                    {!!(col.sortable && sortInfo) && (
                      <TableSortIcon
                        className={'__sort-icon'}
                        column={col}
                        sortInfo={sortInfo}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      }
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TableHead = styled(Component)<Props<any>>(({ theme: { token } }: ThemeProps) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    color: token.colorTextLabel,
    fontFamily: token.fontFamily,
    paddingBottom: token.paddingXS,

    '.__th': {
      flex: 1
    },

    '.__th.-sortable': {
      cursor: 'pointer'
    },

    '.__th-inner': {
      paddingLeft: token.paddingXS,
      paddingRight: token.paddingXS,
      fontSize: token.fontSize,
      lineHeight: token.lineHeight,
      display: 'flex',
      alignItems: 'stretch',
      height: '100%',
      justifyContent: 'center',
      flexDirection: 'column'
    },

    '.__sort-icon': {
      color: token.colorTextLight4
    },

    '.__th:hover .__sort-icon': {
      color: token.colorTextLight3
    },

    '.__sort-icon.-is-asc .__up': {
      color: token.colorTextLight1
    },

    '.__sort-icon.-is-desc  .__down': {
      color: token.colorTextLight1
    },

    '.__th-content': {
      display: 'inline-flex',
      gap: token.sizeXS,
      alignItems: 'center'
    }
  };
}) as typeof Component;

export default TableHead;
