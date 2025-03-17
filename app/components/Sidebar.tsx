'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  ShoppingCartIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'POS', href: '/pos', icon: ShoppingCartIcon },
  { name: 'Sales', href: '/sales', icon: ClipboardDocumentListIcon },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon },
  { name: 'Inventory', href: '/inventory', icon: ArchiveBoxIcon },
  { name: 'Customers', href: '/customers', icon: UsersIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full bg-white border-r">
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b bg-gray-50">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <ShoppingCartIcon className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-gray-900">POS System</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`
                flex items-center px-3 py-2 text-sm font-medium rounded-lg
                transition-colors duration-150 ease-in-out
                ${isActive 
                  ? 'bg-blue-50 text-blue-600' 
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }
              `}
            >
              <item.icon className={`
                h-5 w-5 mr-3
                ${isActive ? 'text-blue-600' : 'text-gray-400'}
              `} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="flex items-center px-4 py-3 border-t">
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <UsersIcon className="h-5 w-5 text-gray-500" />
          </div>
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium text-gray-900">Admin User</p>
          <p className="text-xs text-gray-500">admin@example.com</p>
        </div>
      </div>
    </div>
  );
} 