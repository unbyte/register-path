import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addWindowsPath as addPath } from './windows'

const execute = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', async () => {
  const { promisify } = await import('node:util')
  return { execFile: Object.assign(vi.fn(), { [promisify.custom]: execute }) }
})

describe('Windows callback flow', () => {
  beforeEach(() => execute.mockReset())

  it('passes an empty object and rereads the registry after authorization', async () => {
    execute
      .mockResolvedValueOnce({ stdout: '{"status":"added"}' })
      .mockResolvedValueOnce({ stdout: '{"status":"unchanged"}' })
    const beforeWrite = vi.fn(async (context) => {
      expect(context).toEqual({})
      expect('path' in context).toBe(false)
      expect(execute).toHaveBeenCalledTimes(1)
      return true
    })
    const result = await addPath('C:\\example\\bin', { name: 'example', beforeWrite })
    expect(execute).toHaveBeenCalledTimes(2)
    const command = execute.mock.calls[1][1].at(-1) as string
    const script = Buffer.from(command, 'base64').toString('utf16le')
    const payload = script.match(/FromBase64String\('([^']+)'\)/)?.[1] as string
    expect(JSON.parse(Buffer.from(payload, 'base64').toString('utf8'))).toEqual({
      directory: 'C:\\example\\bin',
      write: true,
      key: 'Environment',
    })
    expect(result).toEqual({ status: 'unchanged' })
  })

  it('does not write when authorization is declined', async () => {
    execute.mockResolvedValue({ stdout: '{"status":"added"}' })
    const result = await addPath('C:\\example\\bin', { name: 'example', beforeWrite: () => false })
    expect(execute).toHaveBeenCalledTimes(1)
    expect(result).toEqual({ status: 'skipped' })
  })

  it('does not ask for authorization when the persistent entry already exists', async () => {
    execute.mockResolvedValue({ stdout: '{"status":"unchanged"}' })
    const beforeWrite = vi.fn(() => true)
    await addPath('C:\\example\\bin', { name: 'example', beforeWrite })
    expect(beforeWrite).not.toHaveBeenCalled()
  })

  it('reports a successful write even when environment notification fails', async () => {
    execute.mockResolvedValueOnce({
      stdout: JSON.stringify({ status: 'added', warning: 'notification failed' }),
    })
    const result = await addPath('C:\\example\\bin', { name: 'example' })
    expect(result).toEqual({
      status: 'added',
      warning: 'notification failed',
    })
    expect(execute).toHaveBeenCalledOnce()
  })

  it.each(['relative', 'C:relative', '\\relative', 'C:\\bad;path', 'C:\\%variable%'])(
    'rejects %s before accessing the registry',
    async (directory) => {
      await expect(addPath(directory, { name: 'example' })).rejects.toThrow(TypeError)
      expect(execute).not.toHaveBeenCalled()
    },
  )
})
