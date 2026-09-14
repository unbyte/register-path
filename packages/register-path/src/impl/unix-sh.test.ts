import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { registerPosixPath } from './unix-posix'
import { registerShPath } from './unix-sh'

vi.mock('node:os', () => ({ homedir: vi.fn() }))
vi.mock('./unix-posix', () => ({ registerPosixPath: vi.fn() }))
const home = resolve('fixtures', 'home')
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(homedir).mockReturnValue(home)
  vi.stubEnv('ENV', '')
})
afterEach(() => vi.unstubAllEnvs())
it.each([undefined, resolve('fixtures', 'interactive')])(
  'uses ENV=%s or falls back to .profile',
  async (path) => {
    if (path) vi.stubEnv('ENV', path)
    const options = { name: 'example' }
    await registerShPath('/opt/bin', options)
    expect(registerPosixPath).toHaveBeenCalledExactlyOnceWith(
      path ?? join(home, '.profile'),
      '/opt/bin',
      options,
    )
  },
)
it('rejects a relative ENV', () => {
  vi.stubEnv('ENV', 'relative')
  expect(() => registerShPath('/opt/bin', { name: 'example' })).toThrow('must be absolute')
  expect(registerPosixPath).not.toHaveBeenCalled()
})
