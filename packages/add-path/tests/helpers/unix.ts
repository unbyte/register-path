import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, vi } from 'vitest'

export function useUnixHome(shell = 'sh') {
  const fixture = { home: '' }
  beforeEach(async () => {
    fixture.home = await mkdtemp(join(tmpdir(), 'add-path-'))
    vi.stubEnv('HOME', fixture.home)
    vi.stubEnv('SHELL', `/bin/${shell}`)
    vi.stubEnv('ZDOTDIR', '')
    vi.stubEnv('XDG_CONFIG_HOME', '')
    vi.stubEnv('ENV', '')
  })
  afterEach(async () => {
    vi.unstubAllEnvs()
    if (fixture.home) await rm(fixture.home, { recursive: true, force: true })
  })
  return fixture
}
