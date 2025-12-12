# Contributing to UltraChat

Thank you for your interest in contributing to UltraChat! This document provides guidelines and instructions for contributing.

## Git Workflow

We use Git Flow for our branching strategy:

```
main          ─────●─────────────●─────────────●─────
                   │             │             │
hotfix/*           │      ●──────┘             │
                   │                           │
release/*          │             ●─────────────┘
                   │             │
develop       ─────●─────●───────●─────●───────●─────
                         │             │
feature/*                ●─────────────┘
```

### Branches

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features (branch from `develop`)
- `hotfix/*` - Emergency fixes (branch from `main`)
- `release/*` - Release preparation (branch from `develop`)

### Creating a Feature

```bash
# Start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/my-feature

# Work on your feature...
git add .
git commit -m "feat: add my feature"

# Push and create PR
git push origin feature/my-feature
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting, missing semicolons, etc.
- `refactor` - Code restructuring
- `perf` - Performance improvements
- `test` - Adding tests
- `chore` - Maintenance tasks

### Examples

```
feat(chat): add message reactions
fix(auth): resolve token refresh race condition
docs(api): update OpenAPI specification
refactor(gateway): extract rate limiting to middleware
```

## Code Style

### TypeScript

- Use TypeScript strict mode
- Prefer `interface` over `type` for object shapes
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Vue Components

- Use `<script setup>` syntax
- Use Composition API
- Keep components focused and small
- Use TypeScript for props and emits

### NestJS Services

- Follow modular architecture
- Use dependency injection
- Handle errors appropriately
- Add proper logging

## Pull Request Process

1. **Create PR** against `develop` branch
2. **Fill out PR template** with description and testing notes
3. **Ensure CI passes** - linting, tests, build
4. **Request review** from at least one team member
5. **Address feedback** and update as needed
6. **Squash and merge** once approved

### PR Checklist

- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] No hardcoded values
- [ ] Error handling implemented

## Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/ultrachat.git
cd ultrachat

# Install dependencies
pnpm install

# Start infrastructure
docker-compose up -d mysql mongodb redis nats minio elasticsearch

# Run migrations
pnpm run migrate

# Start development
pnpm run dev
```

## Testing

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @ultrachat/gateway test

# Run tests with coverage
pnpm test -- --coverage
```

## Questions?

- Open an issue for bugs or feature requests
- Join our Discord for discussions
- Check existing issues before creating new ones

Thank you for contributing! 🎉
