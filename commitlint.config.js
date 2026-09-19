export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'ci', 'build', 'perf', 'revert',
      // design·deploy는 새 컨벤션에서 빠졌지만, CI가 PR에 담긴 예전 커밋까지 다시 검사하므로
      // 기존 기록이 통과하도록 남겨 둔다. 새 커밋에는 쓰지 않는다
      'design', 'deploy'],
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
