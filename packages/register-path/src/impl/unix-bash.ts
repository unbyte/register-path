import { homedir } from 'node:os'
import { join } from 'node:path'
import { isReadable } from '../file'
import type { RegisterPathOptions } from '../types'
import { registerPosixPath } from './unix-posix'

export async function registerBashPath(directory: string, options: RegisterPathOptions) {
  const home = homedir()
  let selected = join(home, process.platform === 'darwin' ? '.profile' : '.bashrc')
  for (const file of ['.bashrc', '.bash_profile', '.bash_login', '.profile']) {
    const path = join(home, file)
    if (await isReadable(path)) {
      selected = path
      break
    }
  }
  return registerPosixPath(selected, directory, options)
}
