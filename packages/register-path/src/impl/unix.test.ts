import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { RegisterPathError } from '../error'
import { registerUnixPath } from './unix'
import { registerBashPath } from './unix-bash'
import { registerFishPath } from './unix-fish'
import { registerShPath } from './unix-sh'
import { registerZshPath } from './unix-zsh'

vi.mock('./unix-bash', () => ({ registerBashPath: vi.fn() }))
vi.mock('./unix-fish', () => ({ registerFishPath: vi.fn() }))
vi.mock('./unix-sh', () => ({ registerShPath: vi.fn() }))
vi.mock('./unix-zsh', () => ({ registerZshPath: vi.fn() }))
const handlers = [registerBashPath, registerFishPath, registerShPath, registerZshPath]

beforeEach(() => {
  vi.resetAllMocks()
  for (const handler of handlers)
    vi.mocked(handler).mockResolvedValue({ path: '/config', status: 'added' })
})
afterEach(() => vi.unstubAllEnvs())

describe('Unix dispatch', () => {
  it.each([
    ['bash', registerBashPath],
    ['zsh', registerZshPath],
    ['fish', registerFishPath],
    ['sh', registerShPath],
    ['dash', registerShPath],
  ] as const)('dispatches %s to its own handler', async (shell, handler) => {
    vi.stubEnv('SHELL', `/bin/${shell}`)
    const options = { name: 'example' }
    expect(await registerUnixPath('/opt/bin', options)).toEqual({
      path: '/config',
      status: 'added',
    })
    expect(handler).toHaveBeenCalledExactlyOnceWith('/opt/bin', options)
    for (const other of handlers) if (other !== handler) expect(other).not.toHaveBeenCalled()
  })

  it.each(['', 'unsupported'])('rejects an unknown shell: %s', async (shell) => {
    vi.stubEnv('SHELL', shell)
    await expect(registerUnixPath('/opt/bin', { name: 'example' })).rejects.toThrow(
      'Unsupported or unknown shell',
    )
    for (const handler of handlers) expect(handler).not.toHaveBeenCalled()
  })

  it.each(['relative', '/has:separator'])(
    'rejects invalid Unix paths before dispatch: %s',
    async (directory) => {
      await expect(registerUnixPath(directory, { name: 'example' })).rejects.toThrow(TypeError)
      for (const handler of handlers) expect(handler).not.toHaveBeenCalled()
    },
  )

  it('preserves the path and original cause reported by a shell handler', async () => {
    vi.stubEnv('SHELL', 'fish')
    const error = new RegisterPathError(
      'write failed',
      '/config/example.fish',
      new Error('disk full'),
    )
    vi.mocked(registerFishPath).mockRejectedValue(error)
    await expect(registerUnixPath('/opt/bin', { name: 'example' })).rejects.toBe(error)
  })
})
