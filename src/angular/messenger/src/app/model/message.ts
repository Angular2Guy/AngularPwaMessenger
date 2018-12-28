export interface Message {
  id?: number;
  fromId: string;
  toId: string;
  timestamp: number,
  text: string,
  send: boolean,
  received: boolean
}