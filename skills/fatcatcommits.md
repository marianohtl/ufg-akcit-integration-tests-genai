---
name: fatcatcommits
description: A skill to create high-quality Git commits using Conventional Commits, semantic clarity, and best practices for maintainable history.
license: MIT
------------

# fatcatcommits

A practical skill for writing clean, consistent, and meaningful Git commits using **Conventional Commits** and modern version control patterns.

---

## Purpose

This skill helps you:

* Standardize commit messages
* Improve readability of project history
* Enable automation (changelog, versioning)
* Communicate intent clearly to your team

---

## Core Principles

1. Clarity over cleverness
2. Small, focused commits
3. Consistent structure
4. Explain WHY, not just WHAT

---

## Conventional Commit Format

```
<type>(optional scope): <short description>

[optional body]

[optional footer(s)]
```

---

## Commit Types

| Type     | Description                                |
| -------- | ------------------------------------------ |
| feat     | New feature                                |
| fix      | Bug fix                                    |
| docs     | Documentation changes                      |
| style    | Formatting, no code change                 |
| refactor | Code restructuring without behavior change |
| test     | Adding or updating tests                   |
| chore    | Maintenance tasks                          |
| perf     | Performance improvements                   |
| build    | Build system or dependency changes         |
| ci       | CI/CD changes                              |

---

## Examples

### Simple commit

```
feat(auth): add JWT authentication
```

### With body

```
fix(api): handle null response from payment service

Prevents crash when external API returns empty payload.
```

### With footer

```
feat!: remove legacy login endpoint

BREAKING CHANGE: /v1/login endpoint removed. Use /v2/auth instead.
```

---

## Best Practices

### 1. Keep commits atomic

One logical change per commit.

### 2. Use imperative mood

✔ add login feature
✘ added login feature

### 3. Limit title length

Ideal: ≤ 50 characters

### 4. Separate subject and body

Leave one blank line between them.

### 5. Reference issues when needed

```
fix(cart): correct total price calculation

Closes #123
```

---

## Advanced Patterns


### Use scopes strategically

```
feat(users): integrate stripe checkout
fix(ui): align button in header
```

### Commit frequently, but meaningfully

Avoid:

```
wip
temp
fix stuff
```

---

## Anti-patterns

* Vague messages:

  ```
  update code
  fix bug
  ```
* Huge commits mixing multiple concerns
* Committing broken code to shared branches

---

## Suggested Workflow

1. Make small changes
2. Stage selectively (git add -p)
3. Write commit using this skill
4. Review before committing
5. Push clean history

##  Quick Template

```
<type>(scope): <description>

<why this change was made>

<footer if needed>
```

---
