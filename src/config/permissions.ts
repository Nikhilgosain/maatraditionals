export type UserRole = 'superadmin' | 'admin' | 'staff';

export interface RoutePermission {
  path: string;
  roles: UserRole[];
}

export const ROUTE_PERMISSIONS: RoutePermission[] = [
  {
    path: '/dashboard',
    roles: ['superadmin', 'admin']
  },
  {
    path: '/dashboard/booking',
    roles: ['superadmin', 'admin']
  },
  {
    path: '/dashboard/summary',
    roles: ['superadmin', 'admin']
  },
  {
    path: '/dashboard/upload',
    roles: ['superadmin']
  },
  {
    path: '/dashboard/inventory',
    roles: ['superadmin', 'admin']
  },
  {
    path: '/dashboard/payments',
    roles: ['superadmin', 'admin']
  }
  // Add more routes as needed
];

export const hasPermission = (userRole: UserRole, path: string): boolean => {
  const route = ROUTE_PERMISSIONS.find(route => path.startsWith(route.path));
  return route ? route.roles.includes(userRole) : false;
};
