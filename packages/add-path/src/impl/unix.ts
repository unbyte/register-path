import { basename, isAbsolute } from 'node:path'
import { toAddPathError } from '../error'
import type { AddPathOptions, AddPathResult } from '../types'
import { addBashPath } from './unix-bash'
import { addFishPath } from './unix-fish'
import { addShPath } from './unix-sh'
import { addZshPath } from './unix-zsh'

export async function addUnixPath(
  directory: string,
  options: AddPathOptions,
): Promise<AddPathResult> {
  if (!isAbsolute(directory)) throw new TypeError('directory must be an absolute path')
  if (directory.includes(':')) throw new TypeError('directory must not contain the PATH separator')
  const shell = basename(process.env.SHELL ?? '')
  try {
    switch (shell) {
      case 'bash':
        return await addBashPath(directory, options)
      case 'zsh':
        return await addZshPath(directory, options)
      case 'fish':
        return await addFishPath(directory, options)
      case 'sh':
      case 'dash':
        return await addShPath(directory, options)
      default:
        throw new Error(`Unsupported or unknown shell: ${shell || '(SHELL is unset)'}`)
    }
  } catch (cause) {
    throw toAddPathError(cause)
  }
}
