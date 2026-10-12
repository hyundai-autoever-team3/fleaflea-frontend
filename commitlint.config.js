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
    // subject-case(제목 첫 글자 소문자)는 알파벳으로 쓴 제목에서만 의미가 있다.
    // 우리 제목은 한글로 쓰고(CONTRIBUTING.md 예시 참고) 한글에는 대소문자가 없으므로,
    // 아무 일도 하지 않는 규칙으로 남겨 두지 않고 꺼 둔다.
    'subject-case': [0],
    'subject-full-stop': [2, 'never', '.'],
    'header-max-length': [2, 'always', 50],
  },
}
