// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

declare module 'eth-simple-keyring' {
  export default class SimpleKeyring {
    constructor (privateKeys: string[]);

    addAccounts (...args: any[]): void;

    decryptMessage (...args: any[]): void;

    deserialize (...args: any[]): void;

    exportAccount (...args: any[]): void;

    getAccounts (...args: any[]): void;

    getAppKeyAddress (...args: any[]): void;

    getEncryptionPublicKey (...args: any[]): void;

    getPrivateKeyFor (...args: any[]): void;

    newGethSignMessage (...args: any[]): void;

    removeAccount (...args: any[]): void;

    serialize (...args: any[]): void;

    signMessage (address: string, message: string, opts?: object): Promise<string>;

    signPersonalMessage (address: string, message: string, opts?: object): Promise<string>;

    signTransaction (...args: any[]): void;

    signTypedData (address: string, data: any[]): Promise<string>;

    signTypedData_v1 (address: string, data: any[]): Promise<string>;

    signTypedData_v3 (address: string, data: any): Promise<string>;

    signTypedData_v4 (address: string, data: any): Promise<string>;

    static captureRejectionSymbol: any;

    static captureRejections: boolean;

    static defaultMaxListeners: number;

    static errorMonitor: any;

    static getEventListeners (emitterOrTarget: any, type: any): any;

    static init (opts: any): void;

    static kMaxEventTargetListeners: any;

    static kMaxEventTargetListenersWarned: any;

    static listenerCount (emitter: any, type: any): any;

    static on (emitter: any, event: any, options: any): any;

    static once (emitter: any, name: any, options: any): any;

    static setMaxListeners (n: any, eventTargets: any): void;

    static type: string;

    static usingDomains: boolean;
  }
}
