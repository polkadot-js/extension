// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { Loading, MetadataReqContext } from '../../components';
import { Header } from '../../partials';
import Request from './Request';

export default function Metadata (): React.ReactElement {
  const requests = useContext(MetadataReqContext);

  return (
    <>
      <Header text='Metadata' />
      {requests[0]
        ? (
          <Request
            key={requests[0].id}
            metaId={requests[0].id}
            request={requests[0].request}
            url={requests[0].url}
          />
        )
        : <Loading />
      }
    </>
  );
}
