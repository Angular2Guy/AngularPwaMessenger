import { Contact } from './contact';

export class MyUser {
  id?: number;
  createdAt: Date;  
  username: string;
  password: string;
  email: string;
  token: string;
  base64Avatar: string;
  publicKey: string;
}