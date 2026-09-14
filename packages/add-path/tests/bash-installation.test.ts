import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('bash-installation', () => {
  const fixture = useUnixHome('bash')

  it('writes one configuration file and does not repeat the callback on reinstall', async () => {
    const file = process.platform === 'darwin' ? '.profile' : '.bashrc'
    const path = join(fixture.home, file)
    const beforeWrite = vi.fn(() => true)
    const options = { name: 'example', beforeWrite }
    expect(await addPath('/opt/example/bin', options)).toEqual({ path, status: 'added' })
    expect(beforeWrite.mock.calls).toEqual([[{ path }]])
    const content = await readFile(path, 'utf8')
    expect(await addPath('/opt/example/bin', options)).toEqual({ path, status: 'unchanged' })
    expect(beforeWrite).toHaveBeenCalledOnce()
    expect(await readFile(path, 'utf8')).toBe(content)
    expect(await readdir(fixture.home)).toEqual([file])
  })
})
