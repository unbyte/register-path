import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll } from 'vitest'
import { registerPath } from '../../src'

export const installedShells = ['bash', 'zsh', 'dash', 'sh', 'fish'].map((shell) => ({
  shell,
  executable:
    process.platform === 'win32'
      ? ''
      : spawnSync('/usr/bin/which', [shell], { encoding: 'utf8' }).stdout?.trim(),
}))

export function useShell(executable: string, fish: boolean) {
  let home: string | undefined
  beforeAll(async () => {
    home = await mkdtemp(join(tmpdir(), 'register-path-shell-'))
  })
  afterAll(async () => {
    if (home) await rm(home, { recursive: true, force: true })
  })
  return (body: string, path: string) =>
    execFileSync(executable, [...(fish ? ['--no-config'] : []), '-c', body], {
      encoding: 'utf8',
      env: {
        PATH: path,
        LC_ALL: 'en_US.UTF-8',
        HOME: home,
        ZDOTDIR: home,
        XDG_CONFIG_HOME: home,
        BASH_ENV: '',
        ENV: '',
      },
    })
}

export async function installedScript(directory: string) {
  const result = await registerPath(directory, { name: 'example' })
  return readFile(result.path as string, 'utf8')
}
