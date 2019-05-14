/**
 *    Copyright 2018 Sven Loesekann
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
       http://www.apache.org/licenses/LICENSE-2.0
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */
import { TestBed } from '@angular/core/testing';

import { CryptoService } from './crypto.service';

describe('CryptoService', () => {
  let privateKey: string = null;
  let publicKey: string = null;
  const privateKeyPwd = 'hallo123';
  let encText: string = null;
  let loginSalt: string = null;
  const base64Image = "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";

  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: CryptoService = TestBed.get(CryptoService);
    expect(service).toBeTruthy();
  });
  
  it('keys should be created', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.generateKeys(privateKeyPwd).then(value => {
      expect(value.a).toBeDefined('value.a missing');
      expect(value.b).toBeDefined('value.b missing');
      privateKey = value.b;
      publicKey = value.a;
      done();
    });
  });
  
  it('encrypt text', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.encryptText('testText', publicKey).then(value => {
      expect(value).toBeDefined('encryption failed');
      expect(value.length > 0).toBeTruthy('encryption failed')
      encText = value;
      done();
    });    
  });
  
  it('decrypt text', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.decryptText(encText, privateKey, privateKeyPwd).then(value => {
      expect(value).toBeDefined('decryption failed');
      expect(value).toBe('testText', 'text not the same');
      done();
    });    
  });
  
  it('encrypt text2', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.encryptLargeText('testText', publicKey).then(value => {
      expect(value).toBeDefined('encryption failed');
      expect(value.length > 0).toBeTruthy('encryption failed')
      encText = value;
      done();
    });    
  });
  
  it('decrypt text2', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.decryptLargeText(encText, privateKey, privateKeyPwd).then(value => {
      expect(value).toBeDefined('decryption failed');
      expect(value).toBe('testText', 'text not the same');
      done();
    });    
  });
  
  it('encrypt image', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.encryptLargeText(base64Image, publicKey).then(value => {
      expect(value).toBeDefined('encryption failed');
      expect(value.length > 0).toBeTruthy('encryption failed')
      encText = value;
      done();
    });    
  });
  
  it('decrypt image', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.decryptLargeText(encText, privateKey, privateKeyPwd).then(value => {
      expect(value).toBeDefined('decryption failed');
      expect(value).toBe(base64Image, 'text not the same');
      done();
    });    
  });
  
  it('login check', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    const password = 'hallo123';
    let pwHash: string = null;
    service.generateKey(password, null).then(value => {
      pwHash = value.a;
      loginSalt = value.b;
      return value;
    }).then(value => service.generateKey(password, value.b))
    .then(value => {
      expect(value.a).toBe(pwHash, 'hashes not equal');
      done();
    });
  });
  
  it('aes encrypt', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    const password = 'hallo123';
    const text = 'testText';
    service.encryptTextAes(password, loginSalt, text).then(value => {
      expect(value).toBeDefined('aes encryption failed');
      encText = value;
      done();
    });
  });
  
  it('aes decrypt', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    const password = 'hallo123';
    const text = encText;
    service.decryptTextAes(password, loginSalt, text).then(value => {
      expect(value).toBe('testText', 'aes decryption failed');
      encText = value;
      done();
    });
  });
  
  it('password hash1', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.hashPW('hallo123').then(value => {
      expect(value).toBe('8MPNb8SyPq6V453hlDeS9izO/YNxWLacY6668wQe00U=', 'hashcode not matching');
      done();
    });
  });
  
  it('password hash2', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.hashPW('hallo1234').then(value => {
      expect(value).toBe('s+GkvLqE+vsSGJP5x7jdLHM1msXVS8UnYPK/NZ8+kBc=', 'hashcode not matching');
      done();
    });
  });
  
  it('password server hash1', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.hashServerPW('hallo123').then(value => {
      expect(value).toBe('Y5rm5bpbv43q+B3BspCfTS1heE8/BtVBnb85wckVYHZwumxYZjQduOErDfGinZKI', 'hashcode not matching');
      done();
    });
  });
  
  it('password server hash2', (done: DoneFn) => {
    const service: CryptoService = TestBed.get(CryptoService);
    service.hashServerPW('hallo1234').then(value => {
      expect(value).toBe('a8rPRtpfbK1rkwWo7UeKmpgrubSjifgj2Kh+b0KIs90cBZuj9TbZyJXz9dngat+C', 'hashcode not matching');
      done();
    });
  });
  
});
