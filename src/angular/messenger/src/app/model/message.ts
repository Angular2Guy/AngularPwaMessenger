export interface Message {
  id?: number;
  fromId: number;
  toId: number;
  timestamp: number,
  text: string,
  send: boolean,
  received: boolean
}