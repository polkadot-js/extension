import React, { useCallback, useContext } from 'react';

import { ActionContext } from '../../components';
import { Header, Icon, Box, Heading, Text, Button } from '../../ui';
import { SvgPolyNew } from '@polkadot/extension-ui/assets/images/icons';

function AddAccount (): React.ReactElement<Props> {
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

export default React.memo(AddAccount);
