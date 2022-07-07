export const environment = {
  production: true,
  wsPath: 'ws://localhost:8080/signalingsocket',
  wssPath: 'wss://REPLACEME/signalingsocket',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
