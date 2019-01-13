import { Tuple } from '../common/tuple';

export class LocalCrypto {
  static generateKey(password: string, salt: string): PromiseLike<Tuple<string,string>> {
    const saltBuffer = salt === null ? window.crypto.getRandomValues(new Uint8Array(8)) : this.toByteArray(salt);  
    const encoder = new TextEncoder();
    const passphraseKey = encoder.encode(password);
    return window.crypto.subtle.importKey(
        'raw', 
        passphraseKey, 
        'PBKDF2', 
        false, 
        ['deriveBits', 'deriveKey']
      ).then((key) => {
        return window.crypto.subtle.deriveKey(
            { "name": 'PBKDF2',
              "salt": saltBuffer,
              // don't get too ambitious, or at least remember
              // that low-power phones will access your app
              "iterations": 128,
              "hash": 'SHA-256'
            },
            key,

            // Note: for this demo we don't actually need a cipher suite,
            // but the api requires that it must be specified.
            // For AES the length required to be 128 or 256 bits (not bytes)
            { "name": 'AES-CBC', "length": 256 },

            // Whether or not the key is extractable (less secure) or not (more secure)
            // when false, the key can only be passed as a web crypto object, not inspected
            true,

            // this web crypto object will only be allowed for these functions
            [ "encrypt", "decrypt" ]
          )
        }).then((webKey) => {
          return crypto.subtle.exportKey("raw", webKey);
        }).then((buffer) => {
          return new Tuple(this.toHexString(buffer), this.toHexString(saltBuffer));
      });    
  }
  
  private static toHexString(byteArray: Uint8Array | ArrayBuffer): string {
    if(byteArray.constructor === ArrayBuffer) {
      byteArray = new Uint8Array(byteArray);
    }
    return Array.prototype.map.call(byteArray, (byte) => {
      return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('');
  }
  
  private static toByteArray(hexString: string): Uint8Array {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
  }
}