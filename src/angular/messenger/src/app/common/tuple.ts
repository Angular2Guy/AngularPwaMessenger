export class Tuple<A,B> {
  private _a:A;
  private _b:B;
  
  constructor(a: A, b: B) {
    this._a = a;
    this._b = b;
  }
  
  get a():A {
    return this._a;
  }
  
  get b():B {
    return this._b;
  }
}