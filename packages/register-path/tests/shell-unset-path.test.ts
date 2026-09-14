import { describe, expect, it } from 'vitest'
import { installedScript, installedShells, useShell } from './helpers/shell'
import { useUnixHome } from './helpers/unix'

for (const { shell, executable } of installedShells) {
  describe.skipIf(!executable)(`${shell} shell-unset-path`, () => {
    useUnixHome(shell)
    const fish = shell === 'fish'
    const run = useShell(executable, fish)
    it('does not introduce empty entries when PATH is unset', async () => {
      const block = await installedScript('/opt/bin')
      const script = fish
        ? `set -e PATH\n${block}\nstring join : -- $PATH; true`
        : `unset PATH\nset -u\n${block}\nprintf "%s\\n" "$PATH"`
      expect(run(script, '/usr/bin').trimEnd()).toBe('/opt/bin')
    })
  })
}
