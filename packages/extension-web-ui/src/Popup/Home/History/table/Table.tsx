// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ActivityIndicator } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useMemo } from 'react';
import styled from 'styled-components';

import { GeneralProps, TableColumnType, TableSortInfo, ThemeProps } from '../../types';
import { TableRow } from '../index';
import TableHead from './TableHead';

interface Props<T> extends GeneralProps {
  items: T[],
  columns: TableColumnType<T>[],
  getRowKey: (item: T) => string;
  emptyList?: React.ReactNode;
  onClickRow?: (item: T) => void;
  loading?: boolean;
  setSortInfo?: (sortInfo: TableSortInfo) => void;
  sortInfo?: TableSortInfo;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Component = <T, >({ className, columns, emptyList, getRowKey, items, loading, onClickRow, setSortInfo,
  sortInfo }: Props<T>) => {
  const renderItem = useCallback((item: T) => {
    return (
      <TableRow<T>
        columns={columns}
        data={item}
        key={getRowKey(item)}
        onClick={onClickRow}
      />
    );
  }, [columns, getRowKey, onClickRow]);

  const listNode = useMemo(() => {
    return (
      <div className={'__tr-list'}>
        {items.map(renderItem)}
      </div>
    );
  }, [items, renderItem]);

  return (
    <div className={CN(className, {
      '-loading': loading
    })}
    >
      <TableHead<T>
        columns={columns}
        setSortInfo={setSortInfo}
        sortInfo={sortInfo}
      />

      <div className='__tbody'>
        {
          loading
            ? (
              <div className={'__loading-area'}>
                <ActivityIndicator
                  loading={true}
                  size={32}
                />
              </div>
            )
            : !items.length ? emptyList : listNode
        }
      </div>
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Table = styled(Component)<Props<any>>(({ theme: { token } }: ThemeProps) => {
  return {
    '.__tr + .__tr': {
      marginTop: token.marginXS
    },

    '.__loading-area': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }
  };
}) as typeof Component;

export default Table;
