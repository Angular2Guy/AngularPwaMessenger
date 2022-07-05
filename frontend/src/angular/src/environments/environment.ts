// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  onLocalhost: true,
  wsPath: 'ws://localhost:4200/signalingsocket',
  // for Angular Cli development with generated ssl certificate(helm directory)
  // wsPath: 'wss://dns-name.dns-domain1.dns-domain1:4200/signalingsocket',
  // eslint-disable-next-line @typescript-eslint/naming-convention
  RTCPeerConfiguration: {
    iceServers: [
      {
        urls: 'stun:stun1.l.google.com:19302'
        // urls: 'stun:stun.t-online.de:3478'
      },
      {
         urls: 'turn:openrelay.metered.ca:80',
         username: 'openrelayproject',
         credential: 'openrelayproject',
      },
      {
         urls: 'turn:openrelay.metered.ca:443',
         username: 'openrelayproject',
         credential: 'openrelayproject',
      },
    ]
  }
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
