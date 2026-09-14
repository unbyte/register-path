export interface BeforeWriteContext {
  path?: string
}

export interface AddPathOptions {
  name: string
  beforeWrite?: (context: BeforeWriteContext) => boolean | Promise<boolean>
}

export interface AddPathResult {
  path?: string
  status: 'added' | 'unchanged' | 'skipped'
  warning?: string
}
