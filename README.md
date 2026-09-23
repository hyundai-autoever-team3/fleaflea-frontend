# FleaFlea

**배포 주소: https://fleaflea.app**

초대받은 사람들끼리 여는 플리마켓 서비스. 친구를 초대해 마켓을 열고, 물건을 팔거나 나누거나 빌려주고, 개인 물건 도감을 꾸미며 친구와 거래합니다.

## 주요 기능

- **플리마켓** — 마켓을 열고 초대 링크로 친구를 부릅니다. 상품은 판매·나눔·대여 중 하나로 올립니다.
- **물건 도감** — 내 물건을 칸에 담아 공개/비공개로 관리합니다. 친구끼리는 서로의 공개 도감을 둘러볼 수 있습니다.
- **거래** — 마켓 상품 거래, 도감 물건 대여·교환, 그리고 사연을 적어 보내는 구걸까지 세 종류가 있습니다. 요청 → 수락 → 완료 확인 흐름은 셋 다 같고, 마이페이지의 "내 거래"에서 한 목록으로 봅니다.
- **친구** — 닉네임으로 찾아 요청을 보내고, 상대가 수락하면 친구가 됩니다. 도감을 구경하다 콕 찔러 안부를 전할 수 있습니다.
- **알림** — 거래·친구·콕 찌르기 소식을 SSE로 실시간으로 받습니다.

## 기술 스택

- **프레임워크**: React 19 + Vite + TypeScript
- **스타일**: Tailwind CSS v4 (`@tailwindcss/vite`, CSS-first `@theme`)
- **라우팅**: React Router
- **서버 상태**: TanStack Query + axios
- **클라이언트 상태**: Zustand
- **실시간 알림**: `@microsoft/fetch-event-source` (SSE)
- **린트**: oxlint
- **Git hook**: husky + lint-staged + commitlint
- **패키지 매니저**: pnpm

## 시작하기

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env`의 `VITE_API_BASE_URL`은 **비워 두는 것이 기본값**입니다. 코드가 `/api/v1/...`을 그대로 요청하면 개발 서버(`vite.config.ts`)와 배포(`vercel.json`)의 프록시가 백엔드로 넘깁니다. 브라우저가 우리 도메인 하나만 상대하게 되어 리프레시 토큰 쿠키가 퍼스트파티로 남고, CORS 허용 목록을 관리할 필요도 없습니다.

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

각 슬라이스는 `index.ts`를 public API로 두고, 슬라이스 내부 파일을 다른 슬라이스에서 직접 import하지 않습니다. 같은 레이어끼리도 서로 참조하지 않아서, 여러 엔티티가 함께 쓰는 타입은 `shared`로 내립니다.

## 브랜치 전략 / 커밋 컨벤션

[CONTRIBUTING.md](./CONTRIBUTING.md) 참고.
