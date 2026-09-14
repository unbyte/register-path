import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('invalid-utf8-during-approval', () => {
  const fixture = useUnixHome()

  it('rejects invalid UTF-8 introduced by beforeWrite without overwriting it', async () => {
    const path = join(fixture.home, '.profile')
    const edited = Buffer.from([0x23, 0x20, 0xff, 0x0a])
    await expect(
      registerPath('/opt/bin', {
        name: 'example',
        beforeWrite: async () => {
          await writeFile(path, edited)
          return true
        },
      }),
    ).rejects.toMatchObject({ path, cause: { code: 'ERR_ENCODING_INVALID_ENCODED_DATA' } })
    expect(await readFile(path)).toEqual(edited)
  })
})
