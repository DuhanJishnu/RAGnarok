"use client";

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const withAuth = (WrappedComponent: React.ComponentType) => {
  const Wrapper = (props: any) => {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !isAuthenticated) {
        router.push('/login');
      }
    }, [isAuthenticated, loading, router]);

    if (loading || !isAuthenticated) {
      return <div>Loading...</div>; // Or a spinner component
    }

    return <WrappedComponent {...props} />;
  };

  return Wrapper;
};

export default withAuth;
