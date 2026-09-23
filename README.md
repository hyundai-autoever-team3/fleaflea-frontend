# FleaFlea

**배포 주소: https://fleaflea.app/**

초대받은 사람들끼리 참여하는 우리 동네 플리마켓 서비스. 플리마켓을 열고, 물건을 판매/나눔/대여/교환하고, 개인 물건 도감을 관리하며, 친구와 거래할 수 있습니다.

## 기술 스택

- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`)
- **라우팅**: React Router
- **서버 상태**: TanStack Query + axios
- **클라이언트 상태**: Zustand
- **린트**: oxlint
- **Git hook**: husky + lint-staged + commitlint
- **패키지 매니저**: pnpm

## 시작하기

```bash
pnpm install
cp .env.example .env   # VITE_API_BASE_URL 값 채우기
pnpm dev
```

## 스크립트

| 명령어 | 설명 |
|---|---|
| `pnpm dev` | 개발 서버 실행 |
| `pnpm build` | 타입체크 + 프로덕션 빌드 |
| `pnpm preview` | 빌드 결과 미리보기 |
| `pnpm lint` | oxlint 실행 |

## 폴더 구조

[FSD(Feature-Sliced Design)](https://feature-sliced.design/)를 따릅니다. 상위 레이어는 하위 레이어만 참조할 수 있습니다 (`app → pages → widgets → features → entities → shared`).

```
src/
├── app/        # 라우터, 전역 프로바이더, 전역 스타일
├── pages/      # 라우트 단위 화면
├── widgets/    # 여러 페이지에서 재사용되는 조합 UI (헤더 등)
├── features/   # 사용자 액션 단위 기능 (로그인, 거래 요청 등)
├── entities/   # 도메인 모델과 타입 (user, market, product, trade …)
└── shared/     # 프로젝트 전반에서 쓰는 API 클라이언트, UI 컴포넌트, 유틸
```

각 슬라이스는 `index.ts`를 public API로 두고, 슬라이스 내부 파일을 다른 슬라이스에서 직접 import하지 않습니다.

## 브랜치 전략 / 커밋 컨벤션

[CONTRIBUTING.md](./CONTRIBUTING.md) 참고.
