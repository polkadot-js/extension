// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';
import styled from 'styled-components';

import { Header } from '../partials';

type Props = {};

export default function Upload(): React.ReactElement<Props> {

	return (
		<>
			<HeaderWithSmallerMargin
				text='Restore JSON'
			/>
			<div>
				Upload File Stuff Here
			</div>
		</>
	);
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;
