import { access, lstat, mkdir, open, readFile, realpath, rename, rm, stat } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { absoluteConfigPath, isReadable, readConfig, writeConfig } from './file'

vi.mock('node:fs/promises', () => ({
  access: vi.fn(),
  lstat: vi.fn(),
  mkdir: vi.fn(),
  open: vi.fn(),
  readFile: vi.fn(),
  realpath: vi.fn(),
  stat: vi.fn(),
  rename: vi.fn(),
  rm: vi.fn(),
}))

function fsError(code: string) {
  return Object.assign(new Error(code), { code })
}

beforeEach(() => vi.resetAllMocks())

describe('isReadable', () => {
  it('recognizes an accessible path', async () => {
    vi.mocked(access).mockResolvedValue(undefined)
    expect(await isReadable('/config')).toBe(true)
  })

  it.each(['ENOENT', 'EACCES'])('returns false for %s', async (code) => {
    vi.mocked(access).mockRejectedValue(fsError(code))
    expect(await isReadable('/config')).toBe(false)
  })

  it('propagates unexpected filesystem errors', async () => {
    const error = fsError('EIO')
    vi.mocked(access).mockRejectedValue(error)
    await expect(isReadable('/config')).rejects.toBe(error)
  })
})

describe('readConfig', () => {
  it('preserves a UTF-8 BOM and multibyte characters', async () => {
    const content = '\uFEFF# café 工具\n'
    vi.mocked(stat).mockResolvedValue({ isFile: () => true } as Awaited<ReturnType<typeof stat>>)
    vi.mocked(readFile).mockResolvedValue(Buffer.from(content))
    expect(await readConfig('/config')).toBe(content)
  })

  it('propagates access errors instead of treating the file as missing', async () => {
    const error = fsError('EACCES')
    vi.mocked(stat).mockRejectedValue(error)
    await expect(readConfig('/config')).rejects.toBe(error)
    expect(readFile).not.toHaveBeenCalled()
  })

  it('does not read a non-regular file', async () => {
    vi.mocked(stat).mockResolvedValue({ isFile: () => false } as Awaited<ReturnType<typeof stat>>)
    await expect(readConfig('/config')).rejects.toThrow('Not a configuration file')
    expect(readFile).not.toHaveBeenCalled()
  })

  it('propagates errors while checking a missing target for a dangling symlink', async () => {
    vi.mocked(stat).mockRejectedValue(fsError('ENOENT'))
    const error = fsError('EACCES')
    vi.mocked(lstat).mockRejectedValue(error)
    await expect(readConfig('/config')).rejects.toBe(error)
  })
})

it('rejects relative configuration paths', () => {
  expect(() => absoluteConfigPath('relative')).toThrow('must be absolute')
})

describe('writeConfig', () => {
  const path = resolve('fixtures', '.profile')
  const target = resolve('fixtures', 'dotfiles', 'profile')
  const writeFile = vi.fn()
  const chmod = vi.fn()
  const close = vi.fn()

  beforeEach(() => {
    vi.mocked(realpath).mockResolvedValue(target)
    vi.mocked(stat).mockResolvedValue({ mode: 0o100640 } as Awaited<ReturnType<typeof stat>>)
    vi.mocked(open).mockResolvedValue({ writeFile, chmod, close } as unknown as Awaited<
      ReturnType<typeof open>
    >)
  })

  it('writes and closes a sibling temporary file before replacing the resolved target', async () => {
    await writeConfig(path, '# complete configuration\n')
    const temporary = vi.mocked(open).mock.calls[0][0] as string
    expect(dirname(temporary)).toBe(dirname(target))
    expect(temporary).not.toBe(target)
    expect(open).toHaveBeenCalledWith(temporary, 'wx', 0o640)
    expect(writeFile).toHaveBeenCalledWith('# complete configuration\n', 'utf8')
    expect(chmod).toHaveBeenCalledWith(0o640)
    expect(close).toHaveBeenCalledOnce()
    expect(rename).toHaveBeenCalledWith(temporary, target)
    expect(writeFile.mock.invocationCallOrder[0]).toBeLessThan(close.mock.invocationCallOrder[0])
    expect(close.mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(rename).mock.invocationCallOrder[0],
    )
    expect(rm).toHaveBeenCalledWith(temporary, { force: true })
  })

  it.each(['write', 'chmod', 'close', 'rename'] as const)(
    'cleans up after a %s failure',
    async (stage) => {
      const error = fsError('EIO')
      const operation = { write: writeFile, chmod, close, rename: vi.mocked(rename) }[stage]
      operation.mockRejectedValueOnce(error)
      await expect(writeConfig(path, '# replacement')).rejects.toBe(error)
      expect(close).toHaveBeenCalledOnce()
      if (stage !== 'rename') expect(rename).not.toHaveBeenCalled()
      expect(rm).toHaveBeenCalledWith(vi.mocked(open).mock.calls[0][0], { force: true })
    },
  )

  it('does not remove a temporary file it could not create exclusively', async () => {
    const error = fsError('EEXIST')
    vi.mocked(open).mockRejectedValue(error)
    await expect(writeConfig(path, '# replacement')).rejects.toBe(error)
    expect(writeFile).not.toHaveBeenCalled()
    expect(rename).not.toHaveBeenCalled()
    expect(rm).not.toHaveBeenCalled()
  })

  it('creates missing parent directories and uses default permissions for a new file', async () => {
    vi.mocked(realpath).mockRejectedValue(fsError('ENOENT'))
    vi.mocked(stat).mockRejectedValue(fsError('ENOENT'))
    await writeConfig(path, '# new configuration')
    expect(mkdir).toHaveBeenCalledWith(dirname(path), { recursive: true })
    expect(open).toHaveBeenCalledWith(expect.any(String), 'wx', 0o644)
    expect(chmod).not.toHaveBeenCalled()
    expect(rename).toHaveBeenCalledWith(vi.mocked(open).mock.calls[0][0], path)
  })

  it.each(['resolve', 'stat'])(
    'propagates a %s error without creating a temporary file',
    async (stage) => {
      const error = fsError('EACCES')
      if (stage === 'resolve') vi.mocked(realpath).mockRejectedValue(error)
      else vi.mocked(stat).mockRejectedValue(error)
      await expect(writeConfig(path, '# replacement')).rejects.toBe(error)
      expect(open).not.toHaveBeenCalled()
    },
  )
})
