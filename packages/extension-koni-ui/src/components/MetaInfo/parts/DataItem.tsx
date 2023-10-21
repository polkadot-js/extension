// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import CN from 'classnames';
import React from 'react';
import styled from 'styled-components';

import { InfoItemBase } from './types';

export interface DataInfoItem extends InfoItemBase {
  children: React.ReactNode;
}

export const Component: React.FC<DataInfoItem> = (props: DataInfoItem) => {
  const { children, className, label, valueColorSchema = 'default' } = props;

  return (
    <div className={CN(className, '__row', '-d-column', ' -type-data')}>
      {
        !!label && (
          <div className={'__col __label-col'}>
            <div className={'__label'}>
              {label}
            </div>
          </div>
        )
      }
      <div className={'__col __value-col'}>
        <div className={`__value mono-text -schema-${valueColorSchema}`}>
          {children}
        </div>
      </div>
    </div>
  );
};

const DataItem = styled(Component)<DataInfoItem>(({ theme: { token } }: DataInfoItem) => {
  return {};
});

export default DataItem;
