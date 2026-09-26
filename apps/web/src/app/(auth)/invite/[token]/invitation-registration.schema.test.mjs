import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { invitationRegistrationSchema } from './invitation-registration.schema.ts';

describe('invitationRegistrationSchema', () => {
  const validPassword = 'una frase segura de prueba';

  it('acepta un nombre y contraseñas válidas que coinciden', () => {
    const result = invitationRegistrationSchema.safeParse({
      name: 'Samuel Lozano',
      password: validPassword,
      confirmPassword: validPassword,
    });

    assert.equal(result.success, true);
  });

  it('normaliza los espacios del nombre', () => {
    const result = invitationRegistrationSchema.safeParse({
      name: '  Samuel Lozano  ',
      password: validPassword,
      confirmPassword: validPassword,
    });

    assert.equal(result.success, true);

    if (result.success) {
      assert.equal(result.data.name, 'Samuel Lozano');
    }
  });

  it('rechaza contraseñas que no coinciden', () => {
    const result = invitationRegistrationSchema.safeParse({
      name: 'Samuel Lozano',
      password: validPassword,
      confirmPassword: 'otra frase segura distinta',
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.deepEqual(result.error.issues[0]?.path, ['confirmPassword']);
      assert.equal(
        result.error.issues[0]?.message,
        'Las contraseñas no coinciden.',
      );
    }
  });

  it('rechaza una contraseña con menos de 15 caracteres', () => {
    const result = invitationRegistrationSchema.safeParse({
      name: 'Samuel Lozano',
      password: 'muy corta',
      confirmPassword: 'muy corta',
    });

    assert.equal(result.success, false);
    assert.ok(
      !result.success &&
        result.error.issues.some(
          (issue) =>
            issue.path[0] === 'password' &&
            issue.message ===
              'La contraseña debe contener al menos 15 caracteres.',
        ),
    );
  });

  it('rechaza un nombre vacío', () => {
    const result = invitationRegistrationSchema.safeParse({
      name: '   ',
      password: validPassword,
      confirmPassword: validPassword,
    });

    assert.equal(result.success, false);
    assert.ok(
      !result.success &&
        result.error.issues.some(
          (issue) =>
            issue.path[0] === 'name' &&
            issue.message === 'El nombre es obligatorio.',
        ),
    );
  });
});
