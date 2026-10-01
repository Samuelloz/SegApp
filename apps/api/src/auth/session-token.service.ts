import { createHash, randomBytes } from 'node:crypto';
import { Injectable } from '@nestjs/common';

export type GeneratedSessionToken = {
  token: string;
  tokenHash: string;
};

@Injectable()
export class SessionTokenService {
  generate(): GeneratedSessionToken {
    const token = randomBytes(32).toString('base64url');

    return {
      token,
      tokenHash: this.hash(token),
    };
  }

  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
