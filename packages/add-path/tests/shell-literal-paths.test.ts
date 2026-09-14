import { describe, expect, it } from 'vitest'
import { installedScript, installedShells, useShell } from './helpers/shell'
import { useUnixHome } from './helpers/unix'

for (const { shell, executable } of installedShells) {
  describe.skipIf(!executable)(`${shell} shell-literal-paths`, () => {
    useUnixHome(shell)
    const fish = shell === 'fish'
    const directory =
      '/tmp/a space/it\'s-"quoted"-$HOME-$(echo injected)-`echo injected`-*[a]-\\-工具'
    const run = useShell(executable, fish)
    it('quotes literal paths and is idempotent', async () => {
      const block = await installedScript(directory)
      const printed = fish ? 'string join : -- $PATH' : 'printf "%s\\n" "$PATH"'
      const output = run(`${block}\n${block}\n${printed}`, '/usr/bin').trimEnd()
      expect(output).toBe(`/usr/bin:${directory}`)
    })
  })
}
