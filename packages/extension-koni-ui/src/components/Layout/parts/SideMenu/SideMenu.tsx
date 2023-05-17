
// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

// [object Object]
// SPDX-License-Identifier: Apache-2.0

//[object Object]
// SPDX-License-Identifier: Apache-2.0

import { Menu } from '@subwallet/react-ui';
import CN from 'classnames';
import { Wallet, Rocket, Database, Globe, Clock, Gear, Info, MessengerLogo, ArrowSquareUpRight } from 'phosphor-react';
import { Logo3D } from '@subwallet/extension-koni-ui/components/Logo';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { useLocation, useNavigate } from 'react-router';
import { MenuItemType } from '@subwallet/react-ui/es/menu/hooks/useItems';
import { useMemo } from 'react';

export type Props = ThemeProps;

type SideMenuItemType = MenuItemType;

const menuItems: SideMenuItemType[] = [
  {
    label: 'Porfolio',
    key: '/home',
    icon: <Wallet
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'Crowdloans',
    key: '/home/crowdloans',
    icon: <Rocket
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'Staking',
    key: '/home/staking',
    icon: <Database
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'DApps',
    key: '/home/dapps',
    icon: <Globe
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'History',
    key: '/home/history',
    icon: <Clock
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'Settings',
    key: '/settings',
    icon: <Gear
      height={20}
      weight='fill'
      width={20}
    />
  }
];

const staticMenuItems: SideMenuItemType[] = [
  {
    label: 'FAQs',
    key: '/home/faqs',
    icon: <Info
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'Contact',
    key: '/home/contact',
    icon: <MessengerLogo
      height={20}
      weight='fill'
      width={20}
    />
  },
  {
    label: 'Terms of services',
    key: '/home/tos',
    icon: <ArrowSquareUpRight
      height={20}
      weight='fill'
      width={20}
    />
  }
];

function Component ({ className }: Props): React.ReactElement<Props> {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  // animate sidebar
  // const [isHovered, setHovered] = useState<boolean>(true);

  const handleNavigate = ({ key }: {
    key: string
  }) => navigate(`${key}`);

  const selectedKey = useMemo(() => {
    const availableKey: string[] = [
      ...menuItems.map((i) => i.key as string),
      ...staticMenuItems.map((i) => i.key as string)
    ];
    const current = availableKey.filter((i: string) => i !== '/home' && pathname.includes(i));

    return current.length ? current : ['/home'];
  }, [pathname]);

  return (
    <div
      className={CN(className, 'flex-col', 'side-menu-wrapper', {
        __expanded: true
        // '__expanded': isHovered
      })}
    >
      <div className='logo-container'>
        <Logo3D />
      </div>
      <div className={CN('menu-wrapper', 'flex-col')}>
        <Menu
          items={menuItems}
          onClick={handleNavigate}
          selectedKeys={selectedKey}
        />
        <Menu
          items={staticMenuItems}
          onClick={handleNavigate}
          selectedKeys={selectedKey}
        />
      </div>
    </div>
  );
}

export default Component;
