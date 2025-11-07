#!/usr/bin/env node
/**
 * 시스템 테스트 환경 셋업 스크립트
 * System test environment setup script
 *
 * 이 스크립트는 파일 다운로드 기능 시스템 테스트에 필요한 테스트 파일들을 생성합니다.
 * - 테스트 프로젝트 디렉토리 구조 생성
 * - 5MB 로그 파일 생성
 * - .env 파일 생성 (보안 테스트용)
 * - 마크다운 문서 생성
 * - JSON 설정 파일 생성
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 테스트 프로젝트 디렉토리 경로
const TEST_PROJECT_DIR = path.join(__dirname, 'test-project');

/**
 * 디렉토리 생성 헬퍼
 * Helper to create directories
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`✅ 디렉토리 생성: ${dirPath}`);
  } else {
    console.log(`ℹ️  디렉토리 이미 존재: ${dirPath}`);
  }
}

/**
 * 로그 파일 생성 (5MB)
 * Create log file (5MB)
 */
function createLogFile() {
  const logDir = path.join(TEST_PROJECT_DIR, 'logs');
  ensureDir(logDir);

  const logFilePath = path.join(logDir, 'test-app.log');

  // 기존 파일 삭제 (여러 번 실행해도 항상 5MB 파일 생성)
  if (fs.existsSync(logFilePath)) {
    fs.unlinkSync(logFilePath);
  }

  // 5MB 로그 파일 생성 (정확한 크기 제어)
  const targetSize = 5 * 1024 * 1024; // 5MB
  let totalWritten = 0;

  // 샘플 로그 엔트리
  const sampleEntry = '[2025-01-06T10:00:00.000Z] INFO: Request #1 processed successfully\n';
  const entryLength = sampleEntry.length;

  let logContent = '';
  let entryCount = 0;

  while (totalWritten < targetSize) {
    const timestamp = new Date(Date.now() + entryCount * 1000).toISOString();
    const logEntry = `[${timestamp}] INFO: Request #${entryCount + 1} processed successfully\n`;

    // 목표 크기를 초과하지 않도록 체크
    if (totalWritten + logEntry.length > targetSize) {
      break;
    }

    logContent += logEntry;
    totalWritten += logEntry.length;
    entryCount++;

    // 메모리 효율을 위해 1MB씩 청크로 작성
    if (logContent.length >= 1024 * 1024) {
      fs.writeFileSync(logFilePath, logContent, { flag: 'a' });
      logContent = '';
    }
  }

  // 남은 내용 작성
  if (logContent.length > 0) {
    fs.writeFileSync(logFilePath, logContent, { flag: 'a' });
  }

  const stats = fs.statSync(logFilePath);
  const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`✅ 로그 파일 생성: ${logFilePath} (${fileSizeMB}MB)`);

  return logFilePath;
}

/**
 * .env 파일 생성 (보안 테스트용)
 * Create .env file (for security test)
 */
function createEnvFile() {
  const envFilePath = path.join(TEST_PROJECT_DIR, '.env');
  const envContent = `# 테스트용 환경 변수 파일
# 이 파일은 보안 테스트를 위해 생성되었습니다.

DATABASE_URL=postgresql://user:password@localhost:5432/testdb
API_KEY=test_api_key_1234567890abcdef
SECRET_KEY=test_secret_key_very_secure
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
`;

  fs.writeFileSync(envFilePath, envContent);
  console.log(`✅ .env 파일 생성: ${envFilePath}`);

  return envFilePath;
}

/**
 * 마크다운 문서 생성
 * Create markdown documentation
 */
function createMarkdownFile() {
  const docsDir = path.join(TEST_PROJECT_DIR, 'docs');
  ensureDir(docsDir);

  const mdFilePath = path.join(docsDir, 'api.md');
  const mdContent = `# API 문서

## 개요

이 문서는 테스트 API의 사용 방법을 설명합니다.

## 엔드포인트

### GET /api/users

사용자 목록을 조회합니다.

**요청 예시:**
\`\`\`bash
curl -X GET https://api.example.com/users
\`\`\`

**응답 예시:**
\`\`\`json
{
  "users": [
    {
      "id": 1,
      "name": "홍길동",
      "email": "hong@example.com"
    }
  ]
}
\`\`\`

### POST /api/users

새로운 사용자를 생성합니다.

**요청 본문:**
\`\`\`json
{
  "name": "김철수",
  "email": "kim@example.com"
}
\`\`\`

**응답:**
\`\`\`json
{
  "id": 2,
  "name": "김철수",
  "email": "kim@example.com",
  "created_at": "2025-01-06T10:00:00Z"
}
\`\`\`

## 인증

모든 API 요청은 헤더에 인증 토큰이 필요합니다:

\`\`\`
Authorization: Bearer <your_token>
\`\`\`

## 에러 코드

| 코드 | 설명 |
|------|------|
| 400 | 잘못된 요청 |
| 401 | 인증 실패 |
| 404 | 리소스를 찾을 수 없음 |
| 500 | 서버 내부 오류 |
`;

  fs.writeFileSync(mdFilePath, mdContent);
  console.log(`✅ 마크다운 파일 생성: ${mdFilePath}`);

  return mdFilePath;
}

/**
 * JSON 설정 파일 생성
 * Create JSON configuration file
 */
function createJsonConfigFile() {
  const configDir = path.join(TEST_PROJECT_DIR, 'config');
  ensureDir(configDir);

  const jsonFilePath = path.join(configDir, 'database.json');
  const jsonContent = {
    development: {
      host: 'localhost',
      port: 5432,
      database: 'test_db_dev',
      username: 'dev_user',
      password: 'dev_password',
      pool: {
        min: 2,
        max: 10,
      },
      logging: true,
    },
    production: {
      host: 'db.example.com',
      port: 5432,
      database: 'test_db_prod',
      username: 'prod_user',
      password: 'prod_password',
      pool: {
        min: 5,
        max: 20,
      },
      logging: false,
      ssl: true,
    },
  };

  fs.writeFileSync(jsonFilePath, JSON.stringify(jsonContent, null, 2));
  console.log(`✅ JSON 설정 파일 생성: ${jsonFilePath}`);

  return jsonFilePath;
}

/**
 * 파일 해시 계산 및 출력
 * Calculate and output file hash
 */
function printFileHash(filePath) {
  const fileContent = fs.readFileSync(filePath);
  const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
  const fileName = path.basename(filePath);
  console.log(`  SHA-256: ${fileName} = ${hash}`);
}

/**
 * 메인 셋업 함수
 * Main setup function
 */
function main() {
  console.log('🚀 시스템 테스트 환경 셋업 시작...\n');

  // 테스트 프로젝트 디렉토리 생성
  ensureDir(TEST_PROJECT_DIR);
  console.log('');

  // 각 테스트 파일 생성
  const createdFiles = [];

  console.log('📝 테스트 파일 생성 중...\n');

  createdFiles.push(createLogFile());
  createdFiles.push(createEnvFile());
  createdFiles.push(createMarkdownFile());
  createdFiles.push(createJsonConfigFile());

  console.log('\n📊 생성된 파일 해시 값:');
  createdFiles.forEach((filePath) => {
    printFileHash(filePath);
  });

  console.log('\n✅ 시스템 테스트 환경 셋업 완료!');
  console.log(`\n📁 테스트 프로젝트 위치: ${TEST_PROJECT_DIR}`);
  console.log('\n다음 단계:');
  console.log('1. Remote Claude 앱을 실행하세요: npm start');
  console.log('2. Slack 채널에서 /setup 명령으로 테스트 프로젝트를 설정하세요');
  console.log(`   프로젝트 경로: ${TEST_PROJECT_DIR}`);
  console.log('3. README.md의 테스트 시나리오를 따라 테스트를 수행하세요');
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  TEST_PROJECT_DIR,
  createLogFile,
  createEnvFile,
  createMarkdownFile,
  createJsonConfigFile,
};
