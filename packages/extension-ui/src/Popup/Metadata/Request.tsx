// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { MetadataDef } from '@polkadot/extension-inject/types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, ButtonArea, Table } from '../../components';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { approveMetaRequest, rejectMetaRequest } from '../../messaging';

interface Props {
  request: MetadataDef;
  metaId: string;
  url: string;
}

function Request({ metaId, request, url }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const chain = useMetadata(request.genesisHash);
  const onAction = useContext(ActionContext);

  const _onApprove = useCallback((): void => {
    approveMetaRequest(metaId)
      .then(() => onAction())
      .catch(console.error);
  }, [metaId, onAction]);

  const _onReject = useCallback((): void => {
    rejectMetaRequest(metaId)
      .then(() => onAction())
      .catch(console.error);
  }, [metaId, onAction]);

  const data = [
    { label: t<string>('from'), data: url, dataTitle: url },
    { label: t<string>('chain'), data: request.chain },
    { label: t<string>('icon'), data: request.icon },
    { label: t<string>('decimals'), data: request.tokenDecimals },
    { label: t<string>('symbol'), data: request.tokenSymbol },
    { label: t<string>('upgrade'), data: chain ? chain.specVersion : `${t('<unknown>')} -> ${request.specVersion}` }
  ];

  return (
    <>
      <Column>
        {data.map(({ data, dataTitle, label }) => (
          <Row key={label}>
            <Label>{label}</Label>
            <UnderlineWrapper>
              <Underline />
            </UnderlineWrapper>
            <Data title={dataTitle}>{data}</Data>
          </Row>
        ))}
      </Column>
      <ButtonArea>
        <Button
          isDanger
          onClick={_onReject}
        >
          {t<string>('Dismiss')}
        </Button>
        <Button
          isSuccess
          onClick={_onApprove}
        >
          {t<string>('Update')}
        </Button>
      </ButtonArea>
    </>
  );
}

const Column = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: auto;

  & > :not(:last-child) {
    margin-bottom: 12px;
  }
`;

const Row = styled.div`
  display: flex;
  justify-content: space-between;
  padding-inline: 8px;
`;

const Text = styled.span`
  font-family: 'Karla';
  font-style: normal;
  font-weight: 300;
  font-size: 14px;
  line-height: 145%;

  letter-spacing: 0.07em;

  color: ${({ theme }) => theme.textColorSuggestion};
`;

const Label = styled(Text)`
  text-transform: capitalize;
`;

const Data = styled(Text)`
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const UnderlineWrapper = styled.div`
  flex-grow: 1;
  margin-inline: 5px;
  min-width: 20px;
`;

const Underline = styled.span`
  display: inline-block;
  width: 100%;
  height: 1px;
  vertical-align: baseline;
  background-color: ${({ theme }) => theme.underlineDark};
`;

export default Request;
