// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';
import styled from 'styled-components';

import { Hero, Loading, MetadataReqContext } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import Request from './Request';

export default function Metadata(): React.ReactElement {
  const { t } = useTranslation();
  const requests = useContext(MetadataReqContext);
  const isLast = requests.length === 1;

  return (
    <>
      <StyledHero
        headerText={t('Metadata update')}
        iconType='warning'
      >
        {t('This approval enables future requests to be decoded using this metadata.')}
      </StyledHero>
      {requests[0] ? (
        <Request
          isLast={isLast}
          key={requests[0].id}
          metaId={requests[0].id}
          request={requests[0].request}
          url={requests[0].url}
        />
      ) : (
        <Loading />
      )}
    </>
  );
}

const StyledHero = styled(Hero)`
  margin: 40px;
`;
