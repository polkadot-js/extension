// Copyright 2019-2024 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { InjectedMetadata, InjectedMetadataKnown, InjectedRawMetadata, MetadataDef, RawMetadataDef } from '@polkadot/extension-inject/types';
import type { SendRequest } from './types.js';

// External to class, this.# is not private enough (yet)
let sendRequest: SendRequest;

export class Metadata implements InjectedMetadata {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get (): Promise<InjectedMetadataKnown[]> {
    return sendRequest('pub(metadata.list)');
  }

  public provide (definition: MetadataDef): Promise<boolean> {
    return sendRequest('pub(metadata.provide)', definition);
  }
}

export class RawMetadata implements InjectedRawMetadata {
  constructor (_sendRequest: SendRequest) {
    sendRequest = _sendRequest;
  }

  public get (): Promise<InjectedMetadataKnown[]> {
    return sendRequest('pub(metadata.list)');
  }

  public provide (definition: RawMetadataDef): Promise<boolean> {
    return sendRequest('pub(metadata.provideRaw)', definition);
  }
}
