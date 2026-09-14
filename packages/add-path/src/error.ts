export class AddPathError extends Error {
  constructor(
    message: string,
    public readonly path: string | undefined,
    cause: unknown,
  ) {
    super(message, { cause })
    this.name = 'AddPathError'
  }
}

export function toAddPathError(cause: unknown, path?: string) {
  if (cause instanceof AddPathError) return cause
  return new AddPathError(
    `Could not add directory to PATH${path ? ` in ${path}` : ''}: ${cause instanceof Error ? cause.message : String(cause)}`,
    path,
    cause,
  )
}
