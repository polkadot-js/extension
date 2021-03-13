// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import EventEmitter from 'eventemitter3';
import _ from 'lodash';
import store from 'store';

import { Contact } from '../background/types';

const CONTACTS_KEY = 'contacts';

type OnTypes = 'change';
type ChangeCallback = (contacts: Contact[]) => void;

const ContactsStore = {
  emitter: new EventEmitter(),

  set (contacts: Contact[]): void {
    store.set(CONTACTS_KEY, contacts);
  },

  get (): Contact[] {
    return store.get(CONTACTS_KEY) || [];
  },

  insert (contact?: Contact): void {
    const contacts = this.get();
    let newContacts = [];
    const existContact = _.find(contacts, (item) => item.id === contact.id);

    // If exist, change the contact values
    if (existContact) {
      newContacts = contacts.map((item) => {
        if (item.id === contact.id) {
          return contact;
        }

        return item;
      });

      this.set(newContacts);
    } else {
      newContacts = [...contacts, contact];
      this.set(newContacts);
    }

    this.emitter.emit('change', newContacts);
  },

  delete (contactId: string): void {
    const contacts = this.get();
    const newContacts = contacts.filter((item) => item.id !== contactId);

    this.set(newContacts);
    this.emitter.emit('change', newContacts);
  },

  on (type: OnTypes, cb: ChangeCallback): void {
    this.emitter.on(type, cb);
  }
};

export default ContactsStore;
