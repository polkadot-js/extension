// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { InjectedMetadata, InjectedMetadataKnown, MetadataDef } from '@polkadot/extension-inject/types';
import { SendRequest } from './types';

// External to class, this.# is not private enough (yet)
let sendRequest: SendRequest;

export default class Metadata implements InjectedMetadata {
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
