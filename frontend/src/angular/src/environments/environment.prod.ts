export const environment = {
  production: true,
  wsPath: 'ws://localhost:8080/signalingsocket',
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
      }
    ]
  }
};
