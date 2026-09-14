import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { access, lstat, mkdir, open, readFile, realpath, rename, rm, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'

export async function isReadable(path: string) {
  try {
    await access(path, constants.R_OK)
    return true
  } catch (error) {
    if (['ENOENT', 'EACCES'].includes((error as NodeJS.ErrnoException).code ?? '')) return false
    throw error
  }
}

export async function readConfig(path: string) {
  try {
    const info = await stat(path)
    if (!info.isFile()) throw new Error(`Not a configuration file: ${path}`)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error
    // A dangling symlink is a conflict, not a missing configuration file.
    const info = await lstat(path).catch((cause: NodeJS.ErrnoException) => {
      if (cause.code !== 'ENOENT') throw cause
      return undefined
    })
    if (info) throw new Error(`Cannot resolve configuration file: ${path}`)
    return ''
  }
  return new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(await readFile(path))
}

export async function writeConfig(path: string, content: string) {
  // Replace the symlink's target, keeping the user's symlink intact.
  const target = await realpath(path).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
    return path
  })
  const info = await stat(target).catch((error: NodeJS.ErrnoException) => {
    if (error.code !== 'ENOENT') throw error
    return undefined
  })
  await mkdir(dirname(target), { recursive: true })
  const temporary = join(dirname(target), `.add-path-${randomUUID()}.tmp`)
  const file = await open(temporary, 'wx', info ? info.mode & 0o777 : 0o644)
  try {
    try {
      await file.writeFile(content, 'utf8')
      if (info) await file.chmod(info.mode & 0o777)
    } finally {
      await file.close()
    }
    await rename(temporary, target)
  } finally {
    await rm(temporary, { force: true })
  }
}

export function absoluteConfigPath(value: string) {
  if (!isAbsolute(value)) throw new Error(`Configuration directory must be absolute: ${value}`)
  return value
}
