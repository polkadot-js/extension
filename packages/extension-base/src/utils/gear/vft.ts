// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress, GearApi } from '@gear-js/api';
import { ActorId, getFnNamePrefix, getServiceNamePrefix, TransactionBuilder, ZERO_ADDRESS } from 'sails-js';

import { TypeRegistry } from '@polkadot/types';

export class VFT {
  public readonly registry: TypeRegistry;
  public readonly service: VftService;

  constructor (public api: GearApi, public programId: `0x${string}` = '0x') {
    const types: Record<string, any> = {};

    this.registry = new TypeRegistry();
    this.registry.setKnownTypes({ types });
    this.registry.register(types);

    this.service = new VftService(this);
  }

  newCtorFromCode (code: Uint8Array | Buffer, name: string, symbol: string, decimals: number): TransactionBuilder<null> {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'upload_program',
      ['New', name, symbol, decimals],
      '(String, String, String, u8)',
      'String',
      code
    );

    this.programId = builder.programId;

    return builder;
  }

  newCtorFromCodeId (codeId: `0x${string}`, name: string, symbol: string, decimals: number) {
    const builder = new TransactionBuilder<null>(
      this.api,
      this.registry,
      'create_program',
      ['New', name, symbol, decimals],
      '(String, String, String, u8)',
      'String',
      codeId
    );

    this.programId = builder.programId;

    return builder;
  }
}

export class VftService {
  private _program: VFT;

  constructor (_program: VFT) {
    this._program = _program;
  }

  public approve (spender: ActorId, value: number | string | bigint): TransactionBuilder<boolean> {
    if (!this._program.programId) {
      throw new Error('Program ID is not set');
    }

    return new TransactionBuilder<boolean>(
      this._program.api,
      this._program.registry,
      'send_message',
      ['Vft', 'Approve', spender, value],
      '(String, String, [u8;32], U256)',
      'bool',
      this._program.programId
    );
  }

  public transfer (to: ActorId, value: number | string | bigint): TransactionBuilder<boolean> {
    if (!this._program.programId) {
      throw new Error('Program ID is not set');
    }

    return new TransactionBuilder<boolean>(
      this._program.api,
      this._program.registry,
      'send_message',
      ['Vft', 'Transfer', to, value],
      '(String, String, [u8;32], U256)',
      'bool',
      this._program.programId
    );
  }

  public transferFrom (from: ActorId, to: ActorId, value: number | string | bigint): TransactionBuilder<boolean> {
    if (!this._program.programId) {
      throw new Error('Program ID is not set');
    }

    return new TransactionBuilder<boolean>(
      this._program.api,
      this._program.registry,
      'send_message',
      ['Vft', 'TransferFrom', from, to, value],
      '(String, String, [u8;32], [u8;32], U256)',
      'bool',
      this._program.programId
    );
  }

  public async allowance (owner: ActorId, spender: ActorId, originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('(String, String, [u8;32], [u8;32])', ['Vft', 'Allowance', owner, spender]).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, U256)', reply.payload);

    return result[2].toBigInt() as unknown as bigint;
  }

  public async balanceOf (account: ActorId, originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('(String, String, [u8;32])', ['Vft', 'BalanceOf', account]).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, U256)', reply.payload);

    return result[2].toBigInt() as unknown as bigint;
  }

  public async decimals (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<number> {
    const payload = this._program.registry.createType('(String, String)', ['Vft', 'Decimals']).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, u8)', reply.payload);

    return result[2].toNumber() as unknown as number;
  }

  public async name (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<string> {
    const payload = this._program.registry.createType('(String, String)', ['Vft', 'Name']).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, String)', reply.payload);

    return result[2].toString() as unknown as string;
  }

  public async symbol (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<string> {
    const payload = this._program.registry.createType('(String, String)', ['Vft', 'Symbol']).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, String)', reply.payload);

    return result[2].toString() as unknown as string;
  }

  public async totalSupply (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('(String, String)', ['Vft', 'TotalSupply']).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String, U256)', reply.payload);

    return result[2].toBigInt() as unknown as bigint;
  }

  public subscribeToApprovalEvent (callback: (data: { owner: ActorId; spender: ActorId; value: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();

      if (getServiceNamePrefix(payload) === 'Vft' && getFnNamePrefix(payload) === 'Approval') {
        // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-floating-promises
        callback(this._program.registry.createType('(String, String, {"owner":"[u8;32]","spender":"[u8;32]","value":"U256"})', message.payload)[2].toJSON() as unknown as { owner: ActorId; spender: ActorId; value: number | string | bigint });
      }
    });
  }

  public subscribeToTransferEvent (callback: (data: { from: ActorId; to: ActorId; value: number | string | bigint }) => void | Promise<void>): Promise<() => void> {
    return this._program.api.gearEvents.subscribeToGearEvent('UserMessageSent', ({ data: { message } }) => {
      if (!message.source.eq(this._program.programId) || !message.destination.eq(ZERO_ADDRESS)) {
        return;
      }

      const payload = message.payload.toHex();

      if (getServiceNamePrefix(payload) === 'Service' && getFnNamePrefix(payload) === 'Transfer') {
        // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-floating-promises
        callback(this._program.registry.createType('(String, String, {"from":"[u8;32]","to":"[u8;32]","value":"U256"})', message.payload)[2].toJSON() as unknown as { from: ActorId; to: ActorId; value: number | string | bigint });
      }
    });
  }
}
