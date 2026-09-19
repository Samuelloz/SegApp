import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { INVALID_SESSION_MESSAGE } from './auth.constants';
import { extractCurrentCompanyId } from './current-company-id.decorator';
import type { AuthenticatedRequest } from './session-auth.guard';

describe('extractCurrentCompanyId', () => {
  const createContext = (
    request: Partial<AuthenticatedRequest>,
  ): ExecutionContext =>
    ({
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(request),
      }),
    }) as unknown as ExecutionContext;

  it('devuelve el identificador de la empresa de la sesión actual', () => {
    const request = {
      currentSession: {
        membership: {
          companyId: 'company-1',
        },
      },
    } as unknown as AuthenticatedRequest;

    const companyId = extractCurrentCompanyId(createContext(request));

    expect(companyId).toBe('company-1');
  });

  it.each([
    ['una sesión', {}],
    [
      'el identificador de la empresa',
      {
        currentSession: {
          membership: {
            companyId: '',
          },
        },
      },
    ],
  ])('rechaza una petición sin %s', (_scenario, request) => {
    const extract = () =>
      extractCurrentCompanyId(
        createContext(request as unknown as AuthenticatedRequest),
      );

    expect(extract).toThrow(UnauthorizedException);
    expect(extract).toThrow(INVALID_SESSION_MESSAGE);
  });
});
