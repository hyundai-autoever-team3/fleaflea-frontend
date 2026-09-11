export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'chore', 'design', 'fix', 'test', 'deploy', 'refactor', 'docs'],
    ],
    // subject-case (lowercase first letter) only makes sense for Latin-alphabet subjects.
    // Our subjects are written in Korean (see CONTRIBUTING.md example), which has no
    // case, so this default conventional-commit rule is turned off rather than left as
    // a no-op that silently never fires.
    'subject-case': [0],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 50],
  },
}
