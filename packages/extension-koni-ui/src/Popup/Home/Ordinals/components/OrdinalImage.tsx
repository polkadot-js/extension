// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import CN from 'classnames';
import React, { useMemo } from 'react';
import styled from 'styled-components';
import { OrdinalNftProperties } from '@subwallet/extension-base/types';

interface Props extends ThemeProps {
  properties: OrdinalNftProperties;
}

const Component: React.FC<Props> = (props: Props) => {
  const { className, properties } = props;

  const data = useMemo(() => {
    return {
      p: properties.p.value,
      op: properties.op.value,
      tick: properties.tick.value
    };
  }, [properties]);

  return (
    <div className={CN(className)}>
      <div className='content'>
        <div className='tick'>{data.tick}</div>
        <div className='other'>
          <div>
            {data.p}
          </div>
          <div>
            {data.op}
          </div>
        </div>
      </div>
    </div>
  );
};

const OrdinalImage = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    backgroundColor: token['gray-6'],
    position: 'relative',
    height: '100%',

    '.content': {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translateX(-50%) translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      whiteSpace: 'nowrap',
      alignItems: 'center',
      color: token.orange
    },

    '.other': {
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: token.sizeXS
    }
  };
});

export default OrdinalImage;
