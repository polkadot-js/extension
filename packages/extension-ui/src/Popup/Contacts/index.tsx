// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import _ from 'lodash';
import React, { useContext } from 'react';
import styled from 'styled-components';

import { ContactsContext } from '@polkadot/extension-ui/components';

import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import Contact from './Contact';

interface Props extends ThemeProps {
  className?: string;
}

function Contacts ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const groupedContacts = useContext(ContactsContext);

  const getContactsView = () => {
    const views = [];

    _.forEach(groupedContacts, (contacts, key) => {
      views.push(<div className='navbar'>{key}</div>);

      _.forEach(contacts, (contact) => {
        views.push(<Contact contact={contact} />);
      });
    });

    return views;
  };

  return (
    <>
      <Header
        showBackArrow
        showContactAdd
        smallMargin
        text={t<string>('Contacts')}
      />
      <>
        <div className={className}>
          {getContactsView()}
        </div>
      </>
    </>
  );
}

export default styled(Contacts)`
  height: 100%;
  overflow-y: auto;
  flex-direction: 'column';
  padding-left: 0px;
  padding-right: 0px;

  .navbar {
    background: rgb(221, 225, 235);
    font-size: 16px;
    padding: 4px;
    padding-left: 10px;
    font-weight: bold;
  }
`;
