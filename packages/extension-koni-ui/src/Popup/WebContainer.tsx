import { WithSideMenu } from '@subwallet/extension-koni-ui/components/Layout/base/WithSideMenu';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useContext } from 'react';
import { Outlet } from 'react-router-dom'

const WebContainer: React.FC = () => {
  const { isWebUI } = useContext(ScreenContext);

  if (!isWebUI) return <Outlet />

  return (
    <WithSideMenu>
      <Outlet />
    </WithSideMenu>
  )
}

export default WebContainer;
