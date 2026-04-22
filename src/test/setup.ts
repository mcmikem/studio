import { vi } from 'vitest';

vi.mock('@/firebase', () => ({
  useFirestore: vi.fn(),
  useAuth: vi.fn(),
  useUser: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
}));

Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  writable: true,
  configurable: true,
});
