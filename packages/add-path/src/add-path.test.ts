import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addPath } from './add-path'
import { addUnixPath } from './impl/unix'
import { addWindowsPath } from './impl/windows'

vi.mock('./impl/unix', () => ({ addUnixPath: vi.fn() }))
vi.mock('./impl/windows', () => ({ addWindowsPath: vi.fn() }))
const platform = Object.getOwnPropertyDescriptor(process, 'platform') as PropertyDescriptor

beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(addUnixPath).mockResolvedValue({ path: '/config', status: 'added' })
  vi.mocked(addWindowsPath).mockResolvedValue({ status: 'added' })
})
afterEach(() => Object.defineProperty(process, 'platform', platform))

describe('platform dispatch', () => {
  it.each(['win32', 'linux', 'darwin'])(
    'dispatches %s to only its platform handler',
    async (os) => {
      Object.defineProperty(process, 'platform', { value: os })
      const directory = os === 'win32' ? 'C:\\example\\bin' : '/opt/bin'
      const options = { name: 'example' }
      const handler = os === 'win32' ? addWindowsPath : addUnixPath
      const other = os === 'win32' ? addUnixPath : addWindowsPath
      const result = await addPath(directory, options)
      expect(handler).toHaveBeenCalledExactlyOnceWith(directory, options)
      expect(other).not.toHaveBeenCalled()
      expect(result).toEqual(
        os === 'win32' ? { status: 'added' } : { path: '/config', status: 'added' },
      )
    },
  )

  it('rejects caller-selected shells before dispatching', async () => {
    const beforeWrite = vi.fn(() => true)
    await expect(
      addPath('/opt/bin', {
        name: 'example',
        beforeWrite,
        // @ts-expect-error Shell selection is internal to the library.
        shells: ['bash', 'zsh'],
      }),
    ).rejects.toThrow('Shell selection is automatic')
    expect(addUnixPath).not.toHaveBeenCalled()
    expect(addWindowsPath).not.toHaveBeenCalled()
    expect(beforeWrite).not.toHaveBeenCalled()
  })

  it.each(['append', 'prepend'])('rejects position=%s before dispatching', async (position) => {
    await expect(
      addPath('/opt/bin', {
        name: 'example',
        // @ts-expect-error PATH position is not configurable.
        position,
      }),
    ).rejects.toThrow('position is not supported')
    expect(addUnixPath).not.toHaveBeenCalled()
    expect(addWindowsPath).not.toHaveBeenCalled()
  })

  it.each(['', '/has\0nul', '/has\nnewline'])(
    'rejects invalid directory data before dispatch: %j',
    async (directory) => {
      await expect(addPath(directory, { name: 'example' })).rejects.toThrow(TypeError)
      expect(addUnixPath).not.toHaveBeenCalled()
      expect(addWindowsPath).not.toHaveBeenCalled()
    },
  )
})
