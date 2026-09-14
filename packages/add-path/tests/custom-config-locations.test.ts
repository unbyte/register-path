import { readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import { addPath } from '../src'
import { useUnixHome } from './helpers/unix'

describe.skipIf(process.platform === 'win32')('custom-config-locations', () => {
  const fixture = useUnixHome()

  it.each([
    ['zsh', 'zsh/.zshrc', 'zsh'],
    ['fish', 'config/fish/conf.d/add-path-example.fish', 'config'],
    ['sh', 'interactive-sh', 'interactive-sh'],
    ['dash', 'interactive-sh', 'interactive-sh'],
  ])('writes only the detected %s configuration', async (shell, file, root) => {
    vi.stubEnv('SHELL', `/bin/${shell}`)
    vi.stubEnv('ZDOTDIR', join(fixture.home, 'zsh'))
    vi.stubEnv('XDG_CONFIG_HOME', join(fixture.home, 'config'))
    vi.stubEnv('ENV', join(fixture.home, 'interactive-sh'))
    const beforeWrite = vi.fn(() => true)
    const path = join(fixture.home, file)
    expect(await addPath('/opt/bin', { name: 'example', beforeWrite })).toEqual({
      path,
      status: 'added',
    })
    expect(beforeWrite.mock.calls).toEqual([[{ path }]])
    expect(await readdir(fixture.home)).toEqual([root])
  })
})
