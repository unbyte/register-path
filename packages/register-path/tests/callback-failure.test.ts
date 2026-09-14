import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { RegisterPathError, registerPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('callback-failure', () => {
  const fixture = useUnixHome()

  it('reports the target and cause without writing when the callback throws', async () => {
    let caught: unknown
    try {
      await registerPath('/opt/bin', {
        name: 'example',
        beforeWrite: ({ path }) => {
          if (path === join(fixture.home, '.profile')) throw new Error('dialog failed')
          return true
        },
      })
    } catch (error) {
      caught = error
    }
    expect(caught).toBeInstanceOf(RegisterPathError)
    expect(await readdir(fixture.home)).toEqual([])
    expect((caught as RegisterPathError).path).toBe(join(fixture.home, '.profile'))
    expect((caught as RegisterPathError).cause).toEqual(new Error('dialog failed'))
  })
})
