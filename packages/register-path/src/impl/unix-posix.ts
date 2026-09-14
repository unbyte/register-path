import { toRegisterPathError } from '../error'
import { readConfig, writeConfig } from '../file'
import type { RegisterPathOptions, RegisterPathResult } from '../types'

export async function registerPosixPath(
  path: string,
  directory: string,
  options: RegisterPathOptions,
): Promise<RegisterPathResult> {
  const start = `# ${options.name} start`
  const end = `# ${options.name} end`
  const quoted = `'${directory.replaceAll("'", "'\"'\"'")}'`
  try {
    let content = await readConfig(path)
    if (content.includes(directory) || content.includes(quoted))
      return { path, status: 'unchanged' }
    if (options.beforeWrite) {
      if ((await options.beforeWrite({ path })) !== true) return { path, status: 'skipped' }
      // beforeWrite may perform file I/O or wait for user input; re-read and check its latest contents.
      content = await readConfig(path)
      if (content.includes(directory) || content.includes(quoted))
        return { path, status: 'unchanged' }
    }
    const lines = content.replaceAll('\r\n', '\n').split('\n')
    if (lines.includes(start) || lines.includes(end))
      throw new Error(`The configuration block for ${options.name} is already in use`)
    const value = `"\${PATH:+\${PATH}:}"${quoted}`
    const block = `${start}\ncase ":\${PATH-}:" in\n  *:${quoted}:*) ;;\n  *) export PATH=${value} ;;\nesac\n${end}`
    const newline = content.includes('\r\n') ? '\r\n' : '\n'
    const addition = `${content ? newline + newline : ''}${block.replaceAll('\n', newline)}${newline}`
    await writeConfig(path, content + addition)
    return { path, status: 'added' }
  } catch (cause) {
    throw toRegisterPathError(cause, path)
  }
}
