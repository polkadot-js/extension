// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { OrdinalNftProperties } from '@subwallet/extension-base/types';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { NftItem as NftItem_ } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback } from 'react';
import styled from 'styled-components';

import InscriptionImage from './InscriptionImage';

interface Props extends ThemeProps {
  handleOnClick?: (params?: any) => void;
  routingParams?: any;
  properties: OrdinalNftProperties;
  name: string;
}

function Component (props: Props): React.ReactElement<Props> {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { className, handleOnClick, name, properties, routingParams } = props;

  const onClick = useCallback(() => {
    handleOnClick && handleOnClick(routingParams);
  }, [handleOnClick, routingParams]);

  return (
    <NftItem_
      className={CN(className, 'nft_gallery_wrapper')}
      customImageNode={(
        <InscriptionImage
          properties={properties}
        />
      )}
      onClick={onClick}
      title={name}
    />
  );
}

export const InscriptionGalleryWrapper = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.__image-wrapper': {
      overflow: 'hidden'
    },

    '.nft_gallery_wrapper__loading': {
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }
  });
});
