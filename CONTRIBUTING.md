# 기여 가이드 (Contributing Guide)

Remote Claude 프로젝트에 기여해 주셔서 감사합니다! 이 문서는 프로젝트에 기여하는 방법을 안내합니다.

## 목차

- [행동 강령](#행동-강령)
- [기여 방법](#기여-방법)
- [개발 환경 설정](#개발-환경-설정)
- [코드 스타일](#코드-스타일)
- [커밋 메시지 규칙](#커밋-메시지-규칙)
- [Pull Request 프로세스](#pull-request-프로세스)
- [이슈 리포팅](#이슈-리포팅)

## 행동 강령

이 프로젝트는 [Contributor Covenant](CODE_OF_CONDUCT.md) 행동 강령을 따릅니다. 프로젝트에 참여함으로써 귀하는 이 행동 강령을 준수하는 데 동의하는 것입니다.

## 기여 방법

다음과 같은 방법으로 프로젝트에 기여할 수 있습니다:

- 🐛 **버그 리포트**: 발견한 버그를 이슈로 등록
- 💡 **기능 제안**: 새로운 기능 아이디어 제안
- 📝 **문서 개선**: README, 가이드, 주석 개선
- 🔧 **코드 기여**: 버그 수정, 기능 구현
- 🧪 **테스트 작성**: 테스트 커버리지 향상
- 🌍 **번역**: 다국어 문서 번역

## 개발 환경 설정

### 1. 저장소 포크 및 클론

```bash
# 저장소 포크 (GitHub에서)
# 포크한 저장소 클론
git clone https://github.com/YOUR_USERNAME/remote-claude.git
cd remote-claude

# 원본 저장소를 upstream으로 추가
git remote add upstream https://github.com/dh1789/remote-claude.git
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 설정

```bash
# .env 파일 생성
cp .env.example .env

# .env 파일 편집 (Slack 토큰 설정)
# SLACK_BOT_TOKEN=xoxb-your-token
# SLACK_APP_TOKEN=xapp-your-token
```

### 4. 개발 서버 실행

```bash
# TypeScript로 직접 실행
npm run dev

# 또는 빌드 후 실행
npm run build
npm start
```

### 5. 테스트 실행

```bash
# 전체 테스트 실행
npm test

# Watch 모드로 테스트
npm run test:watch

# 타입 체크
npm run lint
```

## 코드 스타일

### TypeScript 스타일 가이드

- **들여쓰기**: 2 spaces
- **따옴표**: 작은따옴표 (`'`) 사용
- **세미콜론**: 필수
- **타입 정의**: 명시적 타입 사용 권장
- **함수 주석**: JSDoc 형식으로 작성

**예시:**

```typescript
/**
 * 세션 정보 가져오기
 * Get session information
 *
 * @param sessionName - Session name
 * @param projectPath - Project path
 * @returns TmuxSession or null if session doesn't exist
 */
public async getSessionInfo(
  sessionName: string,
  projectPath: string
): Promise<TmuxSession | null> {
  const info = await executor.getSessionInfo(sessionName);

  if (!info) {
    return null;
  }

  return {
    name: info.name,
    projectPath,
    isActive: info.attached,
    lastChecked: new Date().toISOString(),
  };
}
```

### 파일 구조

```
src/
├── bot/           # Slack bot 로직
├── tmux/          # tmux 관리
├── types/         # TypeScript 타입 정의
└── utils/         # 유틸리티 함수
```

### 네이밍 규칙

- **파일명**: kebab-case (`tmux-manager.ts`)
- **클래스**: PascalCase (`TmuxManager`)
- **함수/변수**: camelCase (`getSessionInfo`)
- **상수**: UPPER_SNAKE_CASE (`DEFAULT_OUTPUT_LINES`)
- **인터페이스**: PascalCase (`TmuxSession`)

## 커밋 메시지 규칙

### 커밋 메시지 형식

```
<type>: <subject>

<body>

<footer>
```

### 타입 (Type)

- `feat`: 새로운 기능 추가
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포맷팅 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `test`: 테스트 추가/수정
- `chore`: 빌드, 설정 변경

### 예시

```
feat: 파일 다운로드 기능 추가

- 프로젝트 파일을 Slack으로 다운로드 기능 구현
- 보안 검증 추가 (.env, .git 파일 차단)
- 5MB 크기 제한 적용

Closes #123
```

## Pull Request 프로세스

### 1. 브랜치 생성

```bash
# 최신 main 브랜치로 업데이트
git checkout main
git pull upstream main

# 기능 브랜치 생성
git checkout -b feat/your-feature-name
```

### 2. 변경사항 작업

- 코드 작성
- 테스트 추가
- 문서 업데이트

### 3. 커밋

```bash
git add .
git commit -m "feat: 기능 설명"
```

### 4. 푸시

```bash
git push origin feat/your-feature-name
```

### 5. Pull Request 생성

GitHub에서 Pull Request를 생성하고 다음 정보를 포함하세요:

- **제목**: 명확하고 간결한 설명
- **설명**: 변경 내용, 동기, 테스트 방법
- **관련 이슈**: `Closes #123`, `Fixes #456`
- **스크린샷**: UI 변경이 있는 경우

### PR 체크리스트

- [ ] 모든 테스트 통과
- [ ] 새로운 코드에 테스트 추가
- [ ] 문서 업데이트 (필요한 경우)
- [ ] 코드 스타일 준수
- [ ] 커밋 메시지 규칙 준수
- [ ] 브랜치가 최신 main과 동기화됨

## 이슈 리포팅

### 버그 리포트

버그를 발견했다면 다음 정보를 포함하여 이슈를 등록해 주세요:

**버그 설명**
- 무엇이 잘못되었는지 명확하고 간결하게 설명

**재현 방법**
1. 특정 설정으로 이동
2. 특정 작업 수행
3. 오류 발생

**예상 동작**
- 어떻게 동작해야 하는지 설명

**실제 동작**
- 실제로 어떻게 동작하는지 설명

**환경**
- OS: [예: macOS 14.0]
- Node.js 버전: [예: 18.17.0]
- 프로젝트 버전: [예: 1.0.0]

**추가 정보**
- 스크린샷, 로그, 기타 유용한 정보

### 기능 제안

새로운 기능을 제안하려면:

**기능 설명**
- 제안하는 기능에 대한 명확한 설명

**동기**
- 왜 이 기능이 필요한지 설명
- 어떤 문제를 해결하는지

**대안**
- 고려한 다른 해결 방법

**추가 정보**
- 예시, 스크린샷, 참고 자료

## 질문이나 도움이 필요한 경우

- **이슈**: [GitHub Issues](https://github.com/dh1789/remote-claude/issues)에서 질문
- **토론**: [GitHub Discussions](https://github.com/dh1789/remote-claude/discussions)에서 토론

## 라이선스

기여한 코드는 프로젝트의 [ISC 라이선스](LICENSE)에 따라 배포됩니다.

---

다시 한번 기여해 주셔서 감사합니다! 🎉
