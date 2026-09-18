import { PasswordService } from './password.service';

describe('PasswordService', () => {
  const service = new PasswordService();
  const password = 'una frase de contraseña segura';

  it('genera un hash Argon2id diferente al texto original', async () => {
    const passwordHash = await service.hash(password);

    expect(passwordHash).not.toBe(password);
    expect(passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('acepta la contraseña correcta', async () => {
    const passwordHash = await service.hash(password);

    await expect(service.verify(passwordHash, password)).resolves.toBe(true);
  });

  it('rechaza una contraseña incorrecta', async () => {
    const passwordHash = await service.hash(password);

    await expect(
      service.verify(passwordHash, 'contraseña incorrecta'),
    ).resolves.toBe(false);
  });
});
