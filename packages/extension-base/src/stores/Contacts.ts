// Copyright 2019-2021 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import _ from 'lodash';
import store from 'store';

import { Contact } from '../background/types';

const CONTACTS_KEY = 'contacts';

const ContactsStore = {
  set (contacts: Contact[]): void {
    store.set(CONTACTS_KEY, contacts);
  },

  get (): Contact[] {
    return store.get(CONTACTS_KEY) || [];
  },

  insert (contact?: Contact): void {
    const contacts = this.get();
    const existContact = _.find(contacts, (item) => item.id === contact.id);

    // If exist, change the contact values
    if (existContact) {
      const newContacts = contacts.map((item) => {
        if (item.id === contact.id) {
          return contact;
        }

        return item;
      });

      this.set(newContacts);
    } else {
      this.set([...contacts, contact]);
    }
  },

  delete (contact: Contact): void {
    const contacts = this.get();
    const newContacts = contacts.filter((item) => item.id !== contact.id);

    console.log('newContacts: ', newContacts);

    this.set(newContacts);
  }
};

export default ContactsStore;
