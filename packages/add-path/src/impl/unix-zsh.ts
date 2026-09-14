import { homedir } from 'node:os'
import { join } from 'node:path'
import { absoluteConfigPath } from '../file'
import type { AddPathOptions } from '../types'
import { addPosixPath } from './unix-posix'

export function addZshPath(directory: string, options: AddPathOptions) {
  const path = join(absoluteConfigPath(process.env.ZDOTDIR || homedir()), '.zshrc')
  return addPosixPath(path, directory, options)
}
