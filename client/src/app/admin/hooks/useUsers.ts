// app/admin/hooks/useUsers.ts
'use client'

import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { User, AddUserResponse } from '../types/User';
import { api } from '@/service/api';


export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);

  
const demoUsers: User[] = Array.from({ length: 200 }, (_, i) => ({
  id: i + 1,
  name: `User${i+1}`,
  email: `user${i + 1}@example.com`,
  role: i % 2 === 0 ? 'admin' : 'employee',
  createdAt: new Date(2024, 0, 1 + i).toISOString()
}));



  // Fetch all users
  const fetchUsers = async () => {
    try {
      // const response = await api.get<User[]>(`/api/admin/users`);
      // setUsers(response.data);
      setUsers(demoUsers);
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to fetch users';
      toast.error(errorMsg);
      console.error('Error fetching users:', err);
    } 
  };

  // Add new admin user
  const addUser = async (email: string) => {
    
    try {
     
      const response = await api.put<AddUserResponse>(`/api/admin/users`, {
        email,
        role: 'admin'
      });
      
      if (response.data.success) {
        
        toast.success(response.data.message);
        // Refresh the user list
        await fetchUsers();
        return true;
      } else {
      
        toast.error(response.data.message);
        return false;
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to add user';
    
      toast.error(errorMsg);
      return false;
    }
  };

  
  useEffect(() => {
  setUsers(demoUsers);
}, []);

  // useEffect(() => {
  //   fetchUsers();
  // }, []);

  return {
    users,
    addUser,
    refetch: fetchUsers
  };
};