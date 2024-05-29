// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GeneralProps, TableColumnType, ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

interface Props<T> extends GeneralProps {
  data: T,
  columns: TableColumnType<T>[],
  onClick?: (item: T) => void,
}

const Component = <T, >({ className, columns, data, onClick }: Props<T>) => {
  const _onClick = useCallback(() => {
    onClick?.(data);
  }, [data, onClick]);

  return (
    <div
      className={CN(className, '__tr')}
      onClick={_onClick}
    >
      {
        columns.map((col) => {
          return (
            <div
              className={CN('__td', col.className)}
              key={col.key}
            >
              <div className={'__td-inner'}>
                {col.render(data)}
              </div>
            </div>
          );
        })
      }
    </div>
  );
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const TableRow = styled(Component)<Props<any>>(({ theme: { token } }: ThemeProps) => {
  return {
    display: 'flex',
    flexDirection: 'row',
    flex: 1,
    borderRadius: token.borderRadiusLG,
    backgroundColor: token.colorBgSecondary,

    '.__td': {
      flex: 1
    },
    '.__td-inner': {
      display: 'flex',
      alignItems: 'stretch',
      height: '100%',
      justifyContent: 'center',
      flexDirection: 'column',
      paddingLeft: token.paddingXS,
      paddingRight: token.paddingXS,
      overflow: 'hidden'
    },

    '&.__tr': {
      transition: 'background-color 0.2s ease-in-out',
      padding: token.paddingSM,
      paddingRight: token.paddingXXS,
      paddingBottom: token.paddingSM,
      paddingLeft: token.paddingXXS,
      gap: token.sizeXS
    },
    '&.__tr:hover': {
      backgroundColor: token.colorBgInput
    }
  };
}) as typeof Component;

export default TableRow;
