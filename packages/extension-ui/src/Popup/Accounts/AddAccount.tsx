// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { ThemeProps } from '../../types';

import React, { useCallback, useContext } from 'react';
import styled from 'styled-components';

import { ActionContext } from '../../components';
import { Header, Icon, Box, Heading, Text, Button } from '../../ui';
import { SvgPolyNew } from '@polkadot/extension-ui/assets/images/icons';

interface Props extends ThemeProps {
  className?: string;
}

function AddAccount ({ className }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const onCreateAccount = useCallback(
    (): void => onAction('/account/create'),
    [onAction]
  );

  const onImportSeed = useCallback(
    (): void => onAction('/account/import-seed'),
    [onAction]
  );

  const onImportJson = useCallback(
    (): void => onAction('/account/restore-json'),
    [onAction]
  );

  return (
    <>
      <Header>
        <Box mt="l" pb="5">
          <Box padding={13} borderRadius="50%" width={80} height={80} borderColor="white" borderWidth={4} border="solid" backgroundColor="brandLightest">
            <Icon 
              Asset={SvgPolyNew}
              width={50}
              height={50}
              color="brandMain"
            />
          </Box>
          <Box pt="m" width={220}>
          <Heading variant="h4" color="white">
            Welcome to the  Polymesh Wallet!
          </Heading>
          </Box>
          <Box mt="s" mb="4">
            <Text variant="b2" color="white">
            Manage your Polymesh digital assets by creating an account or signing in to an existing account below. 
            </Text>
          </Box>
        </Box>
      </Header>
      <Box mt="m">
      <Button fluid onClick={onCreateAccount}>Create account</Button>
      </Box>
      <Box mt="s">
      <Button fluid variant="secondary" onClick={onImportSeed}>Import account from seed</Button>
      </Box>
      <Box mt="s">
      <Button fluid variant="ghost" onClick={onImportJson}>Import account from JSON</Button>
      </Box>
    </>
  );
}

export default React.memo(styled(AddAccount)(({ theme }: Props) => `
  color: ${theme.textColor};
  height: 100%;

  h3 {
    color: ${theme.textColor};
    margin-top: 0;
    font-weight: normal;
    font-size: 24px;
    line-height: 33px;
    text-align: center;
  }

  > .image {
    display: flex;
    justify-content: center;
  }

  > .no-accounts p {
    text-align: center;
    font-size: 16px;
    line-height: 26px;
    margin: 0 30px;
    color: ${theme.subTextColor};
  }
`));
