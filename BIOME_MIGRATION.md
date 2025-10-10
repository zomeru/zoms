# Biome.js Migration - Quick Reference

## What Changed

We've migrated from **ESLint + Prettier** to **Biome.js v2.2.5** - a single, faster tool for both linting and formatting.

## For Developers

### Install VS Code Extension

Install the **Biome VS Code extension** for editor integration:
- Extension ID: `biomejs.biome`
- [Biome VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)

The `.vscode/settings.json` is already configured to use Biome as the default formatter.

### Commands

All existing commands work the same way, just using Biome instead:

```bash
# Check and fix formatting + linting
pnpm lint

# Check formatting only
pnpm check-format

# Fix formatting
pnpm format

# Check linting only
pnpm check-lint

# Run all checks (format + lint + types)
pnpm test-all
```

### Git Hooks

Pre-commit hooks work exactly the same - Husky + lint-staged will run Biome on staged files automatically.

## Configuration

- **Main config**: `biome.json` (replaces `eslint.config.mjs` and `prettier.config.js`)
- **Ignore file**: `.biomeignore` (optional, replaces `.prettierignore`)
- **VS Code settings**: `.vscode/settings.json`

## Formatting Rules (Preserved)

- **Quotes**: Single quotes for JS/TS/JSX, single quotes for CSS
- **Indentation**: 2 spaces
- **Line width**: 100 characters
- **Semicolons**: Always
- **Trailing commas**: None
- **Bracket spacing**: Yes
- **JSX quotes**: Single

## Linting Rules (Preserved)

All ESLint rules have been preserved. Rules that were disabled in ESLint remain disabled in Biome:
- No explicit function return types
- No magic numbers
- Console logs allowed
- Empty block statements allowed
- Explicit `any` allowed
- And more...

## Key Differences

1. **Import ordering**: Biome's basic import sorting is enabled but doesn't support Prettier's custom import order groups. Keep imports organized manually if needed.

2. **Performance**: Biome is significantly faster (~10-100x) than ESLint + Prettier.

3. **Single tool**: One configuration file, one tool to run, simpler setup.

## Troubleshooting

### VS Code not formatting?

1. Install the Biome extension
2. Reload VS Code
3. Check `.vscode/settings.json` has `"editor.defaultFormatter": "biomejs.biome"`

### Pre-commit hooks failing?

Run `pnpm test-all` to see what's failing, then `pnpm lint` to auto-fix issues.

### Need to adjust rules?

Edit `biome.json` - see [Biome documentation](https://biomejs.dev/) for available rules.

## Resources

- [Biome Documentation](https://biomejs.dev/)
- [Biome VS Code Extension](https://marketplace.visualstudio.com/items?itemName=biomejs.biome)
- [Configuration Reference](https://biomejs.dev/reference/configuration/)
