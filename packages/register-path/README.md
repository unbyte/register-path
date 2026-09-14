# register-path

Persist a directory in the user's PATH on Unix and Windows.

## Installation

```sh
$ npm install register-path
# or
$ pnpm add register-path
```

## Example

```ts
import { homedir } from 'node:os'
import { join } from 'node:path'
import { registerPath } from 'register-path'

const result = await registerPath(join(homedir(), '.my-app', 'bin'), {
  // A stable application identifier for the shell markers or Fish snippet filename.
  name: 'my-app',

  // Optional: called once before writing, only when a change is needed.
  // Receives { path } on Unix (the target file) or {} on Windows.
  // Return true to continue or false to skip; promises are awaited.
  // Configuration is re-read after the hook completes.
  beforeWrite: ({ path }) => {
    console.log(path)
    return true
  },
})

console.log(result.status) // 'added', 'unchanged', or 'skipped'
```

## License

[MIT](LICENSE)
