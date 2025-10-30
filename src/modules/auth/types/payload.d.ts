export interface Payload {
  sub: string;
  email: string;
  type?: 'access' | 'refresh';
}
