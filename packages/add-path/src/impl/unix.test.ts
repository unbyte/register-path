import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AddPathError } from '../error'
import { addUnixPath } from './unix'
import { addBashPath } from './unix-bash'
import { addFishPath } from './unix-fish'
import { addShPath } from './unix-sh'
import { addZshPath } from './unix-zsh'

vi.mock('./unix-bash', () => ({ addBashPath: vi.fn() }))
vi.mock('./unix-fish', () => ({ addFishPath: vi.fn() }))
vi.mock('./unix-sh', () => ({ addShPath: vi.fn() }))
vi.mock('./unix-zsh', () => ({ addZshPath: vi.fn() }))
const handlers = [addBashPath, addFishPath, addShPath, addZshPath]

beforeEach(() => {
  vi.resetAllMocks()
  for (const handler of handlers)
    vi.mocked(handler).mockResolvedValue({ path: '/config', status: 'added' })
})
afterEach(() => vi.unstubAllEnvs())

describe('Unix dispatch', () => {
  it.each([
    ['bash', addBashPath],
    ['zsh', addZshPath],
    ['fish', addFishPath],
    ['sh', addShPath],
    ['dash', addShPath],
  ] as const)('dispatches %s to its own handler', async (shell, handler) => {
    vi.stubEnv('SHELL', `/bin/${shell}`)
    const options = { name: 'example' }
    expect(await addUnixPath('/opt/bin', options)).toEqual({ path: '/config', status: 'added' })
    expect(handler).toHaveBeenCalledExactlyOnceWith('/opt/bin', options)
    for (const other of handlers) if (other !== handler) expect(other).not.toHaveBeenCalled()
  })

  it.each(['', 'unsupported'])('rejects an unknown shell: %s', async (shell) => {
    vi.stubEnv('SHELL', shell)
    await expect(addUnixPath('/opt/bin', { name: 'example' })).rejects.toThrow(
      'Unsupported or unknown shell',
    )
    for (const handler of handlers) expect(handler).not.toHaveBeenCalled()
  })

  it.each(['relative', '/has:separator'])(
    'rejects invalid Unix paths before dispatch: %s',
    async (directory) => {
      await expect(addUnixPath(directory, { name: 'example' })).rejects.toThrow(TypeError)
      for (const handler of handlers) expect(handler).not.toHaveBeenCalled()
    },
  )

  it('preserves the path and original cause reported by a shell handler', async () => {
    vi.stubEnv('SHELL', 'fish')
    const error = new AddPathError('write failed', '/config/example.fish', new Error('disk full'))
    vi.mocked(addFishPath).mockRejectedValue(error)
    await expect(addUnixPath('/opt/bin', { name: 'example' })).rejects.toBe(error)
  })
})
