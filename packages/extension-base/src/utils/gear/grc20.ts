// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { decodeAddress, GearApi } from '@gear-js/api';
import { ActorId, TransactionBuilder } from 'sails-js';

import { TypeRegistry } from '@polkadot/types';

export class GRC20 {
  public readonly registry: TypeRegistry;
  public readonly service: Grc20Service;

  constructor (public api: GearApi, public programId: `0x${string}` = '0x') {
    const types: Record<string, any> = {
      ActorId: '([u8; 32])',
      U256: '([u64; 4])'
    };

    this.registry = new TypeRegistry();
    this.registry.setKnownTypes({ types });
    this.registry.register(types);

    this.service = new Grc20Service(this);
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

export class Grc20Service {
  private _program: GRC20;

  constructor (_program: GRC20) {
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
      ['Approve', spender, value],
      '(String, ActorId, U256)',
      'bool',
      this._program.programId
    );
  }

  public fromTransfer (from: ActorId, to: ActorId, value: number | string | bigint): TransactionBuilder<boolean> {
    if (!this._program.programId) {
      throw new Error('Program ID is not set');
    }

    return new TransactionBuilder<boolean>(
      this._program.api,
      this._program.registry,
      'send_message',
      ['FromTransfer', from, to, value],
      '(String, ActorId, ActorId, U256)',
      'bool',
      this._program.programId
    );
  }

  public setBalance (newBalance: number | string | bigint): TransactionBuilder<boolean> {
    if (!this._program.programId) {
      throw new Error('Program ID is not set');
    }

    return new TransactionBuilder<boolean>(
      this._program.api,
      this._program.registry,
      'send_message',
      ['SetBalance', newBalance],
      '(String, U256)',
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
      ['Transfer', to, value],
      '(String, ActorId, U256)',
      'bool',
      this._program.programId
    );
  }

  public async allowance (owner: ActorId, spender: ActorId, originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('(String, ActorId, ActorId)', ['Allowance', owner, spender]).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, U256)', reply.payload);

    return result[1].toBigInt() as unknown as bigint;
  }

  public async balanceOf (owner: ActorId, originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('(String, ActorId)', ['BalanceOf', owner]).toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, U256)', reply.payload);

    return result[1].toBigInt() as unknown as bigint;
  }

  public async decimals (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<number> {
    const payload = this._program.registry.createType('String', 'Decimals').toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, u8)', reply.payload);

    return result[1].toNumber() as unknown as number;
  }

  public async name (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<string> {
    const payload = this._program.registry.createType('String', 'Name').toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String)', reply.payload);

    return result[1].toString() as unknown as string;
  }

  public async symbol (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<string> {
    const payload = this._program.registry.createType('String', 'Symbol').toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, String)', reply.payload);

    return result[1].toString() as unknown as string;
  }

  public async totalSupply (originAddress: string, value?: number | string | bigint, atBlock?: `0x${string}`): Promise<bigint> {
    const payload = this._program.registry.createType('String', 'TotalSupply').toHex();
    const reply = await this._program.api.message.calculateReply({
      destination: this._program.programId,
      origin: decodeAddress(originAddress),
      payload,
      value: value || 0,
      gasLimit: this._program.api.blockGasLimit.toBigInt(),
      at: atBlock
    });
    const result = this._program.registry.createType('(String, U256)', reply.payload);

    return result[1].toBigInt() as unknown as bigint;
  }
}
