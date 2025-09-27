export interface User{
    id: string;
    username:string;
    email:string;
    password:string;
    createdAt: Date;
}
export type SafeUser = Omit<User, "password"> & {
  password: null;
};