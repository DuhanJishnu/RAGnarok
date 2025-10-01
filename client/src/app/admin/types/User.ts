// app/admin/types/user.ts
export interface User {
  id: number;
  name:String;
  email: string;
  role: 'employee' | 'admin';
  createdAt?: string;
}

export interface AddUserResponse {
  success: boolean;
  message: string;
  user?: User;
}


