// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { hexToU8a, isHex } from '@polkadot/util';
import { decodeAddress, encodeAddress } from '@polkadot/util-crypto';

import { Renderable } from './types';

const ArgumentValue = ({ children }: { children: Renderable | Renderable[] | undefined }) => {
  if (children === undefined) {
    return <>-</>;
  }

  if (Array.isArray(children)) {
    return (
      <>
        {children.map((child, i) =>
          <RenderableValue key={`${child}-${i}`}>{child}</RenderableValue>
        )}
      </>
    );
  }

  return <RenderableValue>{children}</RenderableValue>;
};

export default ArgumentValue;

const RenderableValue = ({ children }: { children: Renderable }) => {
  if (isAddress(children)) {
    return <Address>{children}</Address>;
  }

  return <>{children}</>;
};

const AddressEllipsisContainer = styled.div`
  display: flex;
`;

const AddressEllipsisLeftPart = styled.div`
  display: block;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
`;

const Address = ({ children }: { children: string }) => (
  <AddressEllipsisContainer>
    <AddressEllipsisLeftPart>{children.slice(0, -4)}</AddressEllipsisLeftPart>
    {children.slice(-4)}
  </AddressEllipsisContainer>
);


const isAddress = (value: unknown): value is string => {
  if (typeof value !== 'string') {
    return false;
  }

  try {
    encodeAddress(isHex(value) ? hexToU8a(value) : decodeAddress(value));

    return true;
  } catch (e) {
    return false;
  }
};