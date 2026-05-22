import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard (Role-Based Access Control)', () => {
  let rolesGuard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
          },
        },
      ],
    }).compile();

    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(rolesGuard).toBeDefined();
  });

  const createMockExecutionContext = (userRole: Role | null, handlerRoles: Role[] | null): ExecutionContext => {
    const mockRequest = {
      user: userRole ? { id: 'user-123', role: userRole } : null,
    };

    const mockContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(handlerRoles);

    return mockContext;
  };

  describe('When no roles are defined on the handler or class', () => {
    it('should grant access to anyone (public/default routes)', () => {
      const context = createMockExecutionContext(Role.AGENT, null);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });
  });

  describe('When route requires SUPERADMIN role', () => {
    it('should grant access to a SUPERADMIN user', () => {
      const context = createMockExecutionContext(Role.SUPERADMIN, [Role.SUPERADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access to an OWNER user', () => {
      const context = createMockExecutionContext(Role.OWNER, [Role.SUPERADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should deny access to an AGENT user', () => {
      const context = createMockExecutionContext(Role.AGENT, [Role.SUPERADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(false);
    });

    it('should deny access to an unauthenticated request', () => {
      const context = createMockExecutionContext(null, [Role.SUPERADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(false);
    });
  });

  describe('When route requires OWNER or ADMIN roles', () => {
    it('should grant access to an OWNER user', () => {
      const context = createMockExecutionContext(Role.OWNER, [Role.OWNER, Role.ADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should grant access to an ADMIN user', () => {
      const context = createMockExecutionContext(Role.ADMIN, [Role.OWNER, Role.ADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should grant access to a SUPERADMIN user (overriding access permissions)', () => {
      const context = createMockExecutionContext(Role.SUPERADMIN, [Role.OWNER, Role.ADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(true);
    });

    it('should deny access to an AGENT user', () => {
      const context = createMockExecutionContext(Role.AGENT, [Role.OWNER, Role.ADMIN]);
      const result = rolesGuard.canActivate(context);
      expect(result).toBe(false);
    });
  });
});
