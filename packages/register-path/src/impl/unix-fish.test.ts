import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type * as FileModule from '../file'
import { readConfig, writeConfig } from '../file'
import { registerFishPath } from './unix-fish'

vi.mock('node:os', () => ({ homedir: vi.fn() }))
vi.mock('../file', async (importOriginal) => ({
  ...(await importOriginal<typeof FileModule>()),
  readConfig: vi.fn(),
  writeConfig: vi.fn(),
}))

const home = resolve('fixtures', 'home')
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(homedir).mockReturnValue(home)
  vi.mocked(readConfig).mockResolvedValue('')
  vi.stubEnv('XDG_CONFIG_HOME', '')
})
afterEach(() => vi.unstubAllEnvs())

it.each([undefined, resolve('fixtures', 'config')])(
  'requests approval for a dedicated snippet using XDG_CONFIG_HOME=%s',
  async (directory) => {
    if (directory) vi.stubEnv('XDG_CONFIG_HOME', directory)
    const path = join(
      directory ?? join(home, '.config'),
      'fish',
      'conf.d',
      'register-path-example.fish',
    )
    const beforeWrite = vi.fn(() => false)
    expect(await registerFishPath('/opt/bin', { name: 'example', beforeWrite })).toEqual({
      path,
      status: 'skipped',
    })
    expect(beforeWrite).toHaveBeenCalledExactlyOnceWith({ path })
    expect(writeConfig).not.toHaveBeenCalled()
  },
)

it('rejects a relative XDG_CONFIG_HOME', async () => {
  vi.stubEnv('XDG_CONFIG_HOME', 'relative')
  await expect(registerFishPath('/opt/bin', { name: 'example' })).rejects.toThrow(
    'must be absolute',
  )
  expect(readConfig).not.toHaveBeenCalled()
})

it('reads once when no approval callback is provided', async () => {
  expect((await registerFishPath('/opt/bin', { name: 'example' })).status).toBe('added')
  expect(readConfig).toHaveBeenCalledOnce()
  expect(writeConfig).toHaveBeenCalledOnce()
})
