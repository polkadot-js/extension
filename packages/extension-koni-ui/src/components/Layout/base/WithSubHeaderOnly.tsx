// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import React from 'react';
import styled from 'styled-components';

import { LayoutBaseProps } from './Base';

type Props = Omit<
LayoutBaseProps,
'headerBackground' | 'headerIcons' | 'headerLeft' | 'headerCenter' | 'headerOnClickLeft' | 'headerPaddingVertical' | 'showHeader'
> & Required<Pick<LayoutBaseProps, 'title'>>
  ;

const Component = (props: Props) => {
  const { children,
    showBackButton = true,
    subHeaderCenter = true,
    subHeaderPaddingVertical = true,
    ...restProps } = props;

  return (
    <Layout.Base
      className={'layout-with-sub-header-only'}
      showBackButton={showBackButton}
      showSubHeader={true}
      subHeaderBackground='transparent'
      subHeaderCenter={subHeaderCenter}
      subHeaderPaddingVertical={subHeaderPaddingVertical}
      {...restProps}
      showHeader={false}
    >
      {children}
    </Layout.Base>
  );
};

const WithSubHeaderOnly = styled(Component)<Props>(({ theme: { token } }: Props) => ({}));

export { WithSubHeaderOnly };
