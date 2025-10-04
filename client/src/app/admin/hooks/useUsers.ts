// app/admin/hooks/useUsers.ts
'use client'

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, AddUserResponse } from '../types/User';
import api from '../services/api';


export const useUsers = () => {
  // const [user, setUser] = useState<User | null>(null);
  const [user, setUser] = useState<User | null>({
  id: 1,
  name: "Demo User",
  email: "demo@example.com",
  role: "admin",
  createdAt: new Date().toISOString()
});
  const [searchEmail,setSearchEmail]=useState<String>('');
    const [loading, setLoading] = useState(false);


//search by email
const searchUserByEmail = async (email: string) => {
    if (!email.trim()) {
      toast.error('Please enter an email address');
      return;
    }

    try {
      setLoading(true);
      setSearchEmail(email);
     
      
      
      
//       const response = await api.get<User>(`/api/admin/users`, {
//   params: {
//     email: email
//   }
// });
      // if (response.data) {
      //   setUser(response.data); // Set as array with single user
      //   toast.success('User found');
      // } else {
      //   setUser(null); // Clear results if no user found
      //   toast.error('User not found');
      // }


    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to search user';
      toast.error(errorMsg);
    
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  const toggleUserRole = async (id:number,currentRole: string) => {
    
    try {
     setLoading(true);
     const newRole = currentRole === 'admin' ? 'employee' : 'admin';

      const response = await api.put<AddUserResponse>(`/api/admin/users`, {
        id,
        role: newRole
      });
      
      if (response.data.success) {
        
        toast.success(response.data.message);
        // Refresh the user list
        await searchUserByEmail(searchEmail as string);
        return true;
      } else {
      
        toast.error(response.data.message);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add user';
    
      toast.error(errorMsg);
      return false;
    } finally {
      setLoading(false);
    }
  };
const clearSearch = () => {
    setUser(null);
    setSearchEmail('');
  };
  
//   useEffect(() => {
//   setUser(user);
// }, []);

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  return {
    user,
    toggleUserRole,
     searchUserByEmail,
     loading,
     clearSearch
  };
};