import { SessionTokenService } from './session-token.service';

describe('SessionTokenService', () => {
  const service = new SessionTokenService();

  it('genera un token y su hash', () => {
    const result = service.generate();

    expect(result.token).toBeTruthy();
    expect(result.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(result.tokenHash).not.toBe(result.token);
  });

  it('genera tokens diferentes en cada ejecución', () => {
    const firstResult = service.generate();
    const secondResult = service.generate();

    expect(firstResult.token).not.toBe(secondResult.token);
    expect(firstResult.tokenHash).not.toBe(secondResult.tokenHash);
  });

  it('calcula nuevamente el mismo hash para un token', () => {
    const { token, tokenHash } = service.generate();

    expect(service.hash(token)).toBe(tokenHash);
  });
});
