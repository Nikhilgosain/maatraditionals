'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { UserRole, hasPermission } from '@/config/permissions';

interface UserData {
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export const usePermissions = (user: UserData | null) => {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('staff');

  useEffect(() => {
    if (!user) {
      setAllowed(false);
      return;
    }

    // Determine user role
    let role: UserRole = 'staff';
    if (user.isSuperAdmin) {
      role = 'superadmin';
    } else if (user.isAdmin) {
      role = 'admin';
    }
    
    setUserRole(role);
    setAllowed(hasPermission(role, pathname));
  }, [pathname, user]);

  return { allowed, userRole };
};

export const useCanAccess = (path: string, user: UserData | null) => {
  const [canAccess, setCanAccess] = useState(false);

  useEffect(() => {
    if (!user) {
      setCanAccess(false);
      return;
    }

    // Determine user role
    let role: UserRole = 'staff';
    if (user.isSuperAdmin) {
      role = 'superadmin';
    } else if (user.isAdmin) {
      role = 'admin';
    }
    
    setCanAccess(hasPermission(role, path));
  }, [path, user]);

  return canAccess;
};
