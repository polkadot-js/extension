// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GeneralProps, TableColumnType, ThemeProps } from '@subwallet/extension-web-ui/types';
import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

interface Props<T> extends GeneralProps {
  columns: TableColumnType<T>[],
}

const Component = <T, >({ className, columns }: Props<T>) => {
  return (
    <div className={CN(className, '__thead')}>
      {
        columns.map((col) => {
          return (
            <div
              className={CN('__th', col.className, {
                '-sortable': col.sortable
              })}
              key={col.key}
            >
              <div className={'__th-inner'}>
                <div className='__th-content-wrapper'>
                  <div className='__th-content'>
                    <div className='__col-title'>
                      {col.title}
                    </div>
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
    color: token.colorTextLight3,
    fontFamily: token.fontFamily,
    paddingBottom: token.padding,
    paddingLeft: token.paddingXXS,
    paddingRight: token.paddingXXS,
    gap: token.sizeXS,

    '.__th': {
      flex: 1
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

    '.__th-content': {
      display: 'inline-flex',
      gap: token.sizeXS,
      alignItems: 'center'
    }
  };
}) as typeof Component;

export default TableHead;
