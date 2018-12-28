export interface Message {
  fromId: number;
  toId: number;
  timestamp: number,
  text: string,
  send: boolean,
  received: boolean
}