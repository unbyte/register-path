import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { RegisterPathError, registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('invalid-utf8', () => {
  const fixture = useUnixHome()

  it.each(['sh', 'fish'])(
    'rejects invalid UTF-8 in %s configuration before approval',
    async (shell) => {
      vi.stubEnv('SHELL', `/bin/${shell}`)
      const path = join(
        fixture.home,
        shell === 'fish' ? '.config/fish/conf.d/register-path-example.fish' : '.profile',
      )
      await mkdir(dirname(path), { recursive: true })
      const original = Buffer.from([0x23, 0x20, 0xff, 0x0a])
      await writeFile(path, original)
      const beforeWrite = vi.fn(() => true)
      await expect(
        registerPath('/opt/bin', { name: 'example', beforeWrite }),
      ).rejects.toBeInstanceOf(RegisterPathError)
      expect(beforeWrite).not.toHaveBeenCalled()
      expect(await readFile(path)).toEqual(original)
    },
  )
})
