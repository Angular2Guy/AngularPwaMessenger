export const environment = {
  production: true,
  onLocalhost: false,
  wsPath: 'ws://localhost:8080/signalingsocket',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
