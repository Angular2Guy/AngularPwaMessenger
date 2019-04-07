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
