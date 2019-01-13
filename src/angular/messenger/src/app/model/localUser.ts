export interface LocalUser {
  id?: number;
  createdAt: Date;
  username: string;
  hash: string;
  salt: string;
  email: string;
  base64Avatar: string;
  publicKey: string;
}