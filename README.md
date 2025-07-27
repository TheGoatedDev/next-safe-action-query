# next-safe-action-query

Type-safe server actions with built-in validation for Next.js

## Features

- 🔄 **Dual Package**: Supports both ESM and CommonJS
- 📦 **Zero Config**: Works out of the box with Next.js
- 🛡️ **Type Safe**: Full TypeScript support with proper type exports
- 🔧 **pnpm**: Optimized for pnpm package manager
- 📝 **Changesets**: Automated versioning and changelog generation
- 🔒 **Fixed Versions**: Enforced exact dependency versions with syncpack

## Installation

```bash
npm install next-safe-action-query
# or
pnpm add next-safe-action-query
# or
yarn add next-safe-action-query
```

## Usage

### ESM (ES Modules)
```typescript
import { createSafeAction, type ActionResult } from 'next-safe-action-query';

const result = await createSafeAction(async () => {
  return { message: 'Hello, World!' };
});
```

### CommonJS
```javascript
const { createSafeAction } = require('next-safe-action-query');

const result = await createSafeAction(async () => {
  return { message: 'Hello, World!' };
});
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+

### Setup

```bash
# Install dependencies
pnpm install

# Build the package
pnpm build

# Check dependency consistency
pnpm lint:deps

# Fix dependency issues
pnpm fix:deps
```

### Build System

This package uses a modern dual-build system:

- **ESM**: Built to `dist/esm/` with native ES modules
- **CJS**: Built to `dist/cjs/` with CommonJS format
- **Types**: TypeScript declarations in `dist/types/`

### Scripts

- `pnpm build` - Build all formats (ESM, CJS, and types)
- `pnpm clean` - Remove build artifacts
- `pnpm changeset` - Add a changeset for versioning
- `pnpm version` - Update versions based on changesets
- `pnpm release` - Build and publish to npm
- `pnpm lint:deps` - Check dependency consistency
- `pnpm fix:deps` - Fix dependency version mismatches

### Version Management

This project uses [Changesets](https://github.com/changesets/changesets) for version management:

1. **Make changes** to the codebase
2. **Add a changeset**: `pnpm changeset`
3. **Commit the changeset** with your changes
4. **Release when ready**: `pnpm version && pnpm release`

### Dependency Management

[Syncpack](https://github.com/JamieMason/syncpack) ensures all dependencies use exact versions:

- All package versions are pinned (no `^` or `~` ranges)
- Consistent formatting across all package.json files
- Automatic detection and fixing of version mismatches

## Package Structure

```
next-safe-action-query/
├── src/                   # TypeScript source files
├── dist/                  # Build output (gitignored)
│   ├── esm/              # ES Modules build
│   ├── cjs/              # CommonJS build
│   └── types/            # TypeScript declarations
├── .changeset/           # Changeset configuration
├── build.js              # Build script
├── tsconfig.json         # TypeScript config
├── tsconfig.build.json   # Build-specific TS config
├── .syncpackrc.json      # Syncpack configuration
└── package.json          # Package configuration
```

## Configuration Files

### TypeScript Config (`tsconfig.json`)
- Uses `NodeNext` module resolution for modern Node.js compatibility
- Strict type checking enabled
- Configured for optimal library development

### Build Config (`tsconfig.build.json`)
- Extends main config
- Generates only type declarations
- Excludes test files

### Syncpack Config (`.syncpackrc.json`)
- Enforces exact versions (no semver ranges)
- Maintains consistent package.json formatting
- Ensures reproducible builds

### Changesets Config (`.changeset/config.json`)
- Configured for public npm publishing
- Automatic changelog generation
- Semantic versioning support

## Publishing

This package is configured for automated publishing:

1. **Manual**: Use `pnpm release`
2. **CI/CD**: Set up GitHub Actions with changesets action

## License

MIT

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add a changeset: `pnpm changeset`
5. Submit a pull request

---

Built with ❤️ using modern TypeScript tooling 