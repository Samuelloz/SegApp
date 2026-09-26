import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildE164PhoneNumber,
  getNationalPhoneDigits,
  isValidE164PhoneNumber,
} from './phone-number.ts';

describe('phone-number', () => {
  it('construye un número E.164 de México sin pedir el prefijo al usuario', () => {
    assert.equal(buildE164PhoneNumber('MX', '871 144 0644'), '+528711440644');
  });

  it('construye un número E.164 utilizando el país seleccionado', () => {
    assert.equal(buildE164PhoneNumber('US', '(213) 373-4253'), '+12133734253');
  });

  it('devuelve vacío mientras no exista un número nacional', () => {
    assert.equal(buildE164PhoneNumber('MX', '  '), '');
  });

  it('recupera los dígitos nacionales del valor almacenado', () => {
    assert.equal(getNationalPhoneDigits('+528711440644', 'MX'), '8711440644');
  });

  it('valida el número completo según las reglas internacionales', () => {
    assert.equal(isValidE164PhoneNumber('+528711440644'), true);
    assert.equal(isValidE164PhoneNumber('+52871'), false);
  });
});
