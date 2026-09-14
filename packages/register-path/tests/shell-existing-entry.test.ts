import { describe, expect, it } from 'vitest'
import { installedScript, installedShells, useShell } from './helpers/shell'
import { useUnixHome } from './helpers/unix'

for (const { shell, executable } of installedShells) {
  describe.skipIf(!executable)(`${shell} shell-existing-entry`, () => {
    useUnixHome(shell)
    const fish = shell === 'fish'
    const directory =
      '/tmp/a space/it\'s-"quoted"-$HOME-$(echo injected)-`echo injected`-*[a]-\\-工具'
    const run = useShell(executable, fish)
    it('does not duplicate an existing manually added entry or move it', async () => {
      const block = await installedScript(directory)
      const path = `/usr/bin:${directory}:/bin`
      expect(
        run(
          `${block}\n${fish ? 'string join : -- $PATH' : 'printf "%s\\n" "$PATH"'}`,
          path,
        ).trimEnd(),
      ).toBe(path)
    })
  })
}
