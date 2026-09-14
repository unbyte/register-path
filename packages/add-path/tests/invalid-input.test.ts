import { readdir } from 'node:fs/promises'
import { describe, expect, it, vi } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('invalid-input', () => {
  const fixture = useUnixHome()

  it('rejects unsupported shells and invalid input before any callback', async () => {
    const beforeWrite = vi.fn(() => true)
    vi.stubEnv('SHELL', '/bin/unknown')
    await expect(addPath('/opt/bin', { name: 'example', beforeWrite })).rejects.toThrow(
      'Unsupported',
    )
    for (const directory of ['', 'relative', '/has:separator', '/has\nnewline', '/has\0nul']) {
      await expect(addPath(directory, { name: 'example', beforeWrite })).rejects.toThrow(TypeError)
    }
    await expect(addPath('/opt/bin', { name: '../bad', beforeWrite })).rejects.toThrow(TypeError)
    expect(beforeWrite).not.toHaveBeenCalled()
    expect(await readdir(fixture.home)).toEqual([])
  })
})
