import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { isReadable } from '../file'
import { registerBashPath } from './unix-bash'
import { registerPosixPath } from './unix-posix'

vi.mock('../file', () => ({ isReadable: vi.fn() }))
vi.mock('node:os', () => ({ homedir: vi.fn() }))
vi.mock('./unix-posix', () => ({ registerPosixPath: vi.fn() }))
const home = resolve('fixtures', 'home')
const platform = Object.getOwnPropertyDescriptor(process, 'platform') as PropertyDescriptor
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(homedir).mockReturnValue(home)
  vi.mocked(isReadable).mockResolvedValue(false)
})
afterEach(() => Object.defineProperty(process, 'platform', platform))

it('prefers an existing Bash rc file', async () => {
  vi.mocked(isReadable).mockResolvedValue(true)
  await registerBashPath('/opt/bin', { name: 'example' })
  expect(registerPosixPath).toHaveBeenCalledWith(join(home, '.bashrc'), '/opt/bin', {
    name: 'example',
  })
})
it('falls back to the first readable Bash login profile', async () => {
  vi.mocked(isReadable)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(false)
    .mockResolvedValueOnce(true)
  await registerBashPath('/opt/bin', { name: 'example' })
  expect(registerPosixPath).toHaveBeenCalledWith(join(home, '.bash_login'), '/opt/bin', {
    name: 'example',
  })
})
it.each([
  ['darwin', '.profile'],
  ['linux', '.bashrc'],
])('chooses %s Bash defaults when no configuration exists', async (os, file) => {
  Object.defineProperty(process, 'platform', { value: os })
  await registerBashPath('/opt/bin', { name: 'example' })
  expect(registerPosixPath).toHaveBeenCalledWith(join(home, file), '/opt/bin', { name: 'example' })
})
it('propagates unexpected profile access errors', async () => {
  const error = Object.assign(new Error('I/O failure'), { code: 'EIO' })
  vi.mocked(isReadable).mockRejectedValue(error)
  await expect(registerBashPath('/opt/bin', { name: 'example' })).rejects.toBe(error)
})
