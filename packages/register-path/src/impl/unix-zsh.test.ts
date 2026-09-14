import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { registerPosixPath } from './unix-posix'
import { registerZshPath } from './unix-zsh'

vi.mock('node:os', () => ({ homedir: vi.fn() }))
vi.mock('./unix-posix', () => ({ registerPosixPath: vi.fn() }))
const home = resolve('fixtures', 'home')
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(homedir).mockReturnValue(home)
  vi.stubEnv('ZDOTDIR', '')
})
afterEach(() => vi.unstubAllEnvs())
it.each([undefined, resolve('fixtures', 'zsh')])(
  'uses ZDOTDIR=%s to select .zshrc',
  async (directory) => {
    if (directory) vi.stubEnv('ZDOTDIR', directory)
    const options = { name: 'example' }
    await registerZshPath('/opt/bin', options)
    expect(registerPosixPath).toHaveBeenCalledExactlyOnceWith(
      join(directory ?? home, '.zshrc'),
      '/opt/bin',
      options,
    )
  },
)
it('rejects a relative ZDOTDIR', () => {
  vi.stubEnv('ZDOTDIR', 'relative')
  expect(() => registerZshPath('/opt/bin', { name: 'example' })).toThrow('must be absolute')
  expect(registerPosixPath).not.toHaveBeenCalled()
})
