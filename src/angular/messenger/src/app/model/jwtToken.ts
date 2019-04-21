export interface JwtToken {
  exp: number,
  iat: number,
  lastmsg: number,
  sub: string,
  auth: MyAuth[]
}

export interface MyAuth{
  autority: string
}