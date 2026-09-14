import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readConfig, writeConfig } from '../file'
import { registerPosixPath } from './unix-posix'

vi.mock('../file', () => ({ readConfig: vi.fn(), writeConfig: vi.fn() }))

const name = 'example.app'
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(readConfig).mockResolvedValue('# user configuration\n')
})

describe('registerPosixPath', () => {
  const path = resolve('fixtures', '.profile')

  it('preserves the cause and target of a write failure', async () => {
    const error = new Error('disk full')
    vi.mocked(writeConfig).mockRejectedValue(error)
    await expect(registerPosixPath(path, '/opt/bin', { name })).rejects.toMatchObject({
      path,
      cause: error,
    })
  })

  it('does not write if reading the latest content fails', async () => {
    const error = new Error('read failed')
    vi.mocked(readConfig).mockResolvedValueOnce('').mockRejectedValueOnce(error)
    await expect(
      registerPosixPath(path, '/opt/bin', { name, beforeWrite: () => true }),
    ).rejects.toMatchObject({
      path,
      cause: error,
    })
    expect(writeConfig).not.toHaveBeenCalled()
  })

  it.each([
    'export PATH="$PATH:/opt/bin"',
    '# /opt/bin is configured elsewhere',
    'export OTHER=/opt/binary',
    '# example.app start\n# /opt/bin',
  ])('leaves existing path mentions untouched: %s', async (content) => {
    vi.mocked(readConfig).mockResolvedValue(content)
    const beforeWrite = vi.fn(() => true)
    await expect(registerPosixPath(path, '/opt/bin', { name, beforeWrite })).resolves.toEqual({
      path,
      status: 'unchanged',
    })
    expect(beforeWrite).not.toHaveBeenCalled()
    expect(writeConfig).not.toHaveBeenCalled()
  })

  it('rechecks for a manual path entry added during approval', async () => {
    vi.mocked(readConfig).mockResolvedValueOnce('').mockResolvedValueOnce('export PATH=/opt/bin')
    const beforeWrite = vi.fn(() => true)
    await expect(registerPosixPath(path, '/opt/bin', { name, beforeWrite })).resolves.toEqual({
      path,
      status: 'unchanged',
    })
    expect(beforeWrite).toHaveBeenCalledExactlyOnceWith({ path })
    expect(writeConfig).not.toHaveBeenCalled()
  })

  it.each(['\n', '\r\n'])(
    'appends simple markers while preserving %j line endings',
    async (newline) => {
      vi.mocked(readConfig).mockResolvedValue(`# user configuration${newline}`)
      await registerPosixPath(path, '/opt/bin', { name })
      expect(readConfig).toHaveBeenCalledOnce()
      expect(writeConfig).toHaveBeenCalledWith(
        path,
        [
          '# user configuration',
          '',
          '',
          '# example.app start',
          `case ":\${PATH-}:" in`,
          "  *:'/opt/bin':*) ;;",
          `  *) export PATH="\${PATH:+\${PATH}:}"'/opt/bin' ;;`,
          'esac',
          '# example.app end',
          '',
        ].join(newline),
      )
    },
  )

  it('recognizes the escaped path when installed again', async () => {
    const directory = "/opt/it's/bin"
    await registerPosixPath(path, directory, { name })
    const content = vi.mocked(writeConfig).mock.calls[0][1] as string
    vi.mocked(readConfig).mockResolvedValue(content)
    const beforeWrite = vi.fn(() => true)
    await expect(registerPosixPath(path, directory, { name, beforeWrite })).resolves.toEqual({
      path,
      status: 'unchanged',
    })
    expect(beforeWrite).not.toHaveBeenCalled()
    expect(writeConfig).toHaveBeenCalledOnce()
  })

  it.each(['# exampleXapp start', '# example.app.extra end'])(
    'matches owner names literally: %s',
    async (content) => {
      vi.mocked(readConfig).mockResolvedValue(content)
      await expect(registerPosixPath(path, '/opt/bin', { name })).resolves.toEqual({
        path,
        status: 'added',
      })
    },
  )
})
