# Remote Claude 파일 첨부 기능 테스트 가이드

## 📋 개요

이 가이드는 v0.3.0에 추가된 **Slack 파일 첨부 기능**과 **DSL Space 키 지원** 기능을 테스트하는 방법을 설명합니다.

## 🔧 사전 준비

### 1. 서비스 상태 확인

```bash
# 서비스 프로세스 확인
ps aux | grep "remote-claude/dist/index.js" | grep -v grep

# 서비스 로그 확인
tail -f /tmp/remote-claude.log
```

### 2. Slack 채널 설정 확인

- Slack 워크스페이스에서 `@remote_claude` 봇이 추가된 채널 사용
- 봇이 파일 읽기 권한(`files:read`)과 쓰기 권한(`files:write`)을 가지고 있는지 확인

## 🧪 테스트 시나리오

### Test Case 1: 이미지 파일 첨부 및 분석 요청 (US-1)

**목적**: PNG/JPG/JPEG 이미지 파일을 첨부하고 Claude Code에 분석을 요청합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 이미지 파일 첨부 (PNG, JPG, JPEG 중 하나)
   - 테스트 파일: 스크린샷, 다이어그램, 차트 등
   - 파일 크기: 5MB 이하
3. 메시지 본문에 프롬프트 입력:
   ```
   이 이미지를 분석해주세요.
   ```
4. 메시지 전송

**예상 결과**:
- ✅ 봇이 파일 수신 확인 메시지 전송
- ✅ 파일이 `/tmp/remote-claude/` 디렉토리에 다운로드됨
- ✅ Claude Code에 `@/tmp/remote-claude/[UUID].png\n\n이 이미지를 분석해주세요.` 형식으로 프롬프트 전달
- ✅ Claude Code의 응답이 Slack 채널에 표시됨
- ✅ Job 완료 후 임시 파일 자동 삭제

**검증 방법**:
```bash
# 서비스 로그에서 파일 다운로드 확인
tail -f /tmp/remote-claude.log | grep "File download"

# 임시 디렉토리 확인 (Job 진행 중에만 파일 존재)
ls -la /tmp/remote-claude/

# Job 완료 후 파일 삭제 확인
# (위 디렉토리가 비어있거나 다른 진행 중 Job의 파일만 존재해야 함)
```

---

### Test Case 2: 텍스트/로그 파일 첨부 및 분석 요청 (US-3)

**목적**: 텍스트 기반 파일(.txt, .log, .md 등)을 첨부하고 분석을 요청합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 텍스트 파일 첨부
   - 테스트 파일: 로그 파일, 설정 파일, 마크다운 등
   - MIME type: `text/*` 계열
   - 파일 크기: 5MB 이하
3. 메시지 본문에 프롬프트 입력:
   ```
   이 로그 파일에서 에러를 찾아주세요.
   ```
4. 메시지 전송

**예상 결과**:
- ✅ 봇이 파일 수신 확인
- ✅ 텍스트 파일이 임시 디렉토리에 저장됨
- ✅ Claude Code가 파일 내용을 읽고 분석
- ✅ 에러 분석 결과가 Slack에 응답됨
- ✅ Job 완료 후 임시 파일 자동 삭제

---

### Test Case 3: DSL Space 키 실행 (US-6)

**목적**: DSL 명령어로 Space 키를 tmux 세션에 전송합니다.

**절차**:
1. Slack 채널에서 메시지 작성 (파일 첨부 없이)
2. DSL 명령어 입력:
   ```
   `s`
   ```
   또는 Space 키를 여러 번 입력:
   ```
   `sss`
   ```
   또는 다른 키와 조합:
   ```
   `dds`
   ```
   (Down + Down + Space)
3. 메시지 전송

**예상 결과**:
- ✅ tmux 세션에 Space 키가 전송됨
- ✅ `` `s` `` → Space 1회 실행
- ✅ `` `sss` `` → Space 3회 실행
- ✅ `` `dds` `` → Down 2회 + Space 1회 실행
- ✅ Slack에 명령어 실행 확인 메시지 표시

**검증 방법**:
```bash
# tmux 세션에서 직접 확인
tmux attach-session -t [세션이름]

# 또는 서비스 로그에서 키 입력 확인
tail -f /tmp/remote-claude.log | grep "send-keys"
```

---

### Test Case 4: 에러 케이스 - 지원하지 않는 파일 형식 (FR-11)

**목적**: 지원하지 않는 파일 형식을 첨부했을 때 에러 처리를 확인합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 지원하지 않는 파일 첨부 (예: GIF, WebP, SVG, PDF, ZIP 등)
3. 프롬프트 입력:
   ```
   이 파일을 분석해주세요.
   ```
4. 메시지 전송

**예상 결과**:
- ✅ 봇이 에러 메시지 전송:
  ```
  ⚠️ 지원하지 않는 파일 형식입니다.
  지원 형식: PNG, JPG, JPEG 이미지 및 텍스트 파일
  ```
- ✅ 파일이 다운로드되지 않음
- ✅ Claude Code로 전달되지 않음

---

### Test Case 5: 에러 케이스 - 파일 크기 초과 (FR-11)

**목적**: 5MB를 초과하는 파일 첨부 시 에러 처리를 확인합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 5MB를 초과하는 파일 첨부
3. 프롬프트 입력 후 전송

**예상 결과**:
- ✅ 봉이 에러 메시지 전송:
  ```
  ⚠️ 파일 크기가 너무 큽니다. (최대 5MB)
  현재 파일 크기: X.XX MB
  ```
- ✅ 파일이 다운로드되지 않음

---

### Test Case 6: 에러 케이스 - 프롬프트 누락 (FR-4, FR-11)

**목적**: 파일만 첨부하고 프롬프트를 입력하지 않았을 때 에러 처리를 확인합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 이미지 파일 첨부
3. 메시지 본문을 비워두거나 공백만 입력
4. 메시지 전송

**예상 결과**:
- ✅ 봇이 에러 메시지 전송:
  ```
  ⚠️ 파일과 함께 프롬프트를 입력해주세요.
  예: "이 이미지를 분석해주세요."
  ```
- ✅ 파일이 처리되지 않음

---

### Test Case 7: 에러 케이스 - 여러 파일 첨부 (FR-5, FR-11)

**목적**: 여러 파일을 동시에 첨부했을 때 첫 번째 파일만 처리되는지 확인합니다.

**절차**:
1. Slack 채널에서 메시지 작성
2. 2개 이상의 파일 첨부
3. 프롬프트 입력:
   ```
   이 파일들을 분석해주세요.
   ```
4. 메시지 전송

**예상 결과**:
- ✅ 봇이 안내 메시지 전송:
  ```
  ℹ️ 여러 파일이 첨부되었습니다. 첫 번째 파일만 처리됩니다.
  처리 파일: [파일명]
  ```
- ✅ 첫 번째 파일만 다운로드 및 처리됨
- ✅ 나머지 파일은 무시됨

---

## 📊 로그 모니터링

테스트 중 실시간 로그를 확인하려면:

```bash
# 전체 로그 모니터링
tail -f /tmp/remote-claude.log

# 파일 관련 로그만 필터링
tail -f /tmp/remote-claude.log | grep -i "file"

# 에러 로그만 필터링
tail -f /tmp/remote-claude.log | grep -i "error\|warn"
```

**주요 로그 메시지**:
- `📎 File download started` - 파일 다운로드 시작
- `📎 File download completed` - 파일 다운로드 완료
- `Temporary file deleted successfully` - Job 완료 후 파일 삭제
- `File attachment detected` - 파일 첨부 감지

---

## 🐛 문제 해결

### 파일이 다운로드되지 않는 경우

1. Slack 앱 권한 확인:
   ```
   필수 권한: files:read, files:write
   ```

2. 환경 변수 확인:
   ```bash
   # .env 파일에 SLACK_BOT_TOKEN이 올바르게 설정되어 있는지 확인
   cat .env | grep SLACK_BOT_TOKEN
   ```

3. 임시 디렉토리 권한 확인:
   ```bash
   # 디렉토리가 존재하고 쓰기 가능한지 확인
   ls -ld /tmp/remote-claude/
   # 권한: drwx------ (0700)
   ```

### 임시 파일이 삭제되지 않는 경우

```bash
# Job이 비정상 종료된 경우 수동으로 정리
rm -rf /tmp/remote-claude/*

# 서비스 재시작
kill [PID] && npm start
```

### DSL Space 키가 작동하지 않는 경우

1. tmux 세션 확인:
   ```bash
   # 세션이 존재하는지 확인
   tmux list-sessions

   # 해당 채널의 설정 확인
   cat ~/.remote-claude/config.json
   ```

2. DSL 파서 로그 확인:
   ```bash
   tail -f /tmp/remote-claude.log | grep "DSL\|parse"
   ```

---

## ✅ 테스트 체크리스트

- [ ] Test Case 1: 이미지 파일 첨부 및 분석 (PNG)
- [ ] Test Case 1-2: 이미지 파일 첨부 및 분석 (JPG/JPEG)
- [ ] Test Case 2: 텍스트 파일 첨부 및 분석
- [ ] Test Case 3: DSL Space 키 실행 (`` `s` ``)
- [ ] Test Case 3-2: DSL Space 키 조합 (`` `dds` ``)
- [ ] Test Case 4: 지원하지 않는 파일 형식 에러
- [ ] Test Case 5: 파일 크기 초과 에러
- [ ] Test Case 6: 프롬프트 누락 에러
- [ ] Test Case 7: 여러 파일 첨부 처리
- [ ] 로그에서 파일 다운로드/삭제 확인
- [ ] 임시 디렉토리 정리 확인

---

## 📞 지원

문제가 발생하면 다음 정보와 함께 이슈를 등록해주세요:

1. 테스트 케이스 번호
2. 예상 결과 vs 실제 결과
3. 서비스 로그 (`/tmp/remote-claude.log`)
4. Slack 메시지 스크린샷
5. 환경 정보 (Node.js 버전, OS)

---

**버전**: v0.3.0
**작성일**: 2025-12-09
**관련 PRD**: `/tasks/0004-prd-slack-file-attachment.md`
