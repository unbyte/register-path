import { describe, expect, it } from 'vitest'
import { installedScript, installedShells, useShell } from './helpers/shell'
import { useUnixHome } from './helpers/unix'

for (const { shell, executable } of installedShells) {
  describe.skipIf(!executable)(`${shell} shell-whole-entry-matching`, () => {
    useUnixHome(shell)
    const fish = shell === 'fish'
    const run = useShell(executable, fish)
    it('matches whole entries, not substrings or glob patterns', async () => {
      const block = await installedScript('/opt/bin')
      const path = '/usr/bin:/opt/binary'
      expect(
        run(
          `${block}\n${fish ? 'string join : -- $PATH' : 'printf "%s\\n" "$PATH"'}`,
          path,
        ).trimEnd(),
      ).toBe(`${path}:/opt/bin`)
    })
  })
}
