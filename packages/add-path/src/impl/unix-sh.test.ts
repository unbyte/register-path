import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { addPosixPath } from './unix-posix'
import { addShPath } from './unix-sh'

vi.mock('node:os', () => ({ homedir: vi.fn() }))
vi.mock('./unix-posix', () => ({ addPosixPath: vi.fn() }))
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
    await addShPath('/opt/bin', options)
    expect(addPosixPath).toHaveBeenCalledExactlyOnceWith(
      path ?? join(home, '.profile'),
      '/opt/bin',
      options,
    )
  },
)
it('rejects a relative ENV', () => {
  vi.stubEnv('ENV', 'relative')
  expect(() => addShPath('/opt/bin', { name: 'example' })).toThrow('must be absolute')
  expect(addPosixPath).not.toHaveBeenCalled()
})
