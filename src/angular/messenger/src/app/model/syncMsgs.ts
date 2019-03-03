import { Message } from './message';

export class SyncMsgs {
    lastUpdate?: Date;
    ownId: String;
    contactIds?: String[];
    msgs?: Message[];
}