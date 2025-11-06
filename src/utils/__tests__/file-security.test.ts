/**
 * 파일 보안 검증 유틸리티 테스트
 * File security validation utility tests
 */

import {
  validateFilePath,
  SENSITIVE_FILE_PATTERNS,
  MAX_FILE_SIZE,
} from '../file-security';
import { initLogger } from '../logger';
import { LogLevel } from '../../types';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('File Security Validation', () => {
  // 테스트 픽스처 변수
  let testDir: string;
  let projectDir: string;

  /**
   * 테스트 디렉토리 및 파일 생성 헬퍼
   * Test directory and file creation helper
   */
  beforeEach(() => {
    // Logger 초기화
    initLogger(LogLevel.ERROR);

    // 임시 테스트 디렉토리 생성
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'file-security-test-'));
    projectDir = path.join(testDir, 'project');
    fs.mkdirSync(projectDir, { recursive: true });
  });

  /**
   * 테스트 후 정리
   * Cleanup after tests
   */
  afterEach(() => {
    // 테스트 디렉토리 삭제
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  /**
   * 테스트 파일 생성 헬퍼
   * Helper to create test files
   */
  function createTestFile(relativePath: string, size: number = 100): string {
    const fullPath = path.join(projectDir, relativePath);
    const dir = path.dirname(fullPath);

    // 디렉토리가 없으면 생성
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 파일 생성
    const content = Buffer.alloc(size, 'a');
    fs.writeFileSync(fullPath, content);

    return fullPath;
  }

  /**
   * 테스트 디렉토리 생성 헬퍼
   * Helper to create test directories
   */
  function createTestDir(relativePath: string): string {
    const fullPath = path.join(projectDir, relativePath);
    fs.mkdirSync(fullPath, { recursive: true });
    return fullPath;
  }

  describe('Happy Path Tests', () => {
    it('should validate a valid relative file path', () => {
      // 테스트 파일 생성
      const testFile = 'src/index.ts';
      createTestFile(testFile);

      // 검증 수행
      const result = validateFilePath(projectDir, testFile);

      // 검증 성공 확인
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(path.join(projectDir, testFile));
      expect(result.error).toBeUndefined();
    });

    it('should handle nested directory paths correctly', () => {
      // 중첩된 디렉토리에 파일 생성
      const testFile = 'src/components/Button.tsx';
      createTestFile(testFile);

      // 검증 수행
      const result = validateFilePath(projectDir, testFile);

      // 검증 성공 확인
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(path.join(projectDir, testFile));
    });

    it('should handle files in project root', () => {
      // 프로젝트 루트에 파일 생성
      const testFile = 'README.md';
      createTestFile(testFile);

      // 검증 수행
      const result = validateFilePath(projectDir, testFile);

      // 검증 성공 확인
      expect(result.valid).toBe(true);
      expect(result.resolvedPath).toBe(path.join(projectDir, testFile));
    });
  });

  describe('Boundary Conditions Tests', () => {
    it('should reject empty file path', () => {
      const result = validateFilePath(projectDir, '');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('파일 경로를 입력해주세요.');
    });

    it('should reject whitespace-only path', () => {
      const result = validateFilePath(projectDir, '   ');

      expect(result.valid).toBe(false);
      expect(result.error).toBe('파일 경로를 입력해주세요.');
    });

    it('should accept file exactly at 10MB size limit', () => {
      // 정확히 10MB 파일 생성
      const testFile = 'large-file.bin';
      createTestFile(testFile, MAX_FILE_SIZE);

      // 검증 수행
      const result = validateFilePath(projectDir, testFile);

      // 10MB는 허용되어야 함
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding 10MB size limit', () => {
      // 10MB + 1 byte 파일 생성
      const testFile = 'too-large.bin';
      createTestFile(testFile, MAX_FILE_SIZE + 1);

      // 검증 수행
      const result = validateFilePath(projectDir, testFile);

      // 크기 초과로 실패해야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('파일 크기가 제한을 초과했습니다');
    });
  });

  describe('Exception Cases Tests', () => {
    it('should block path traversal attacks', () => {
      // Path traversal 시도
      const result = validateFilePath(projectDir, '../../etc/passwd');

      // 차단되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('프로젝트 디렉토리 외부 파일은 접근할 수 없습니다');
    });

    it('should block sensitive .env files', () => {
      // .env 파일 생성
      createTestFile('.env');

      // 검증 수행
      const result = validateFilePath(projectDir, '.env');

      // 민감한 파일로 차단되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('보안상 민감한 파일은 다운로드할 수 없습니다');
    });

    it('should block sensitive key files', () => {
      // *.key 파일 생성
      createTestFile('private.key');

      // 검증 수행
      const result = validateFilePath(projectDir, 'private.key');

      // 민감한 파일로 차단되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('보안상 민감한 파일은 다운로드할 수 없습니다');
    });

    it('should block files with credentials in name', () => {
      // credentials 포함 파일 생성
      createTestFile('aws-credentials.json');

      // 검증 수행
      const result = validateFilePath(projectDir, 'aws-credentials.json');

      // 민감한 파일로 차단되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('보안상 민감한 파일은 다운로드할 수 없습니다');
    });

    it('should reject non-existent files', () => {
      // 존재하지 않는 파일
      const result = validateFilePath(projectDir, 'non-existent.txt');

      // 파일 없음으로 실패해야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('파일을 찾을 수 없습니다');
    });

    it('should reject directory paths', () => {
      // 디렉토리 생성
      const testDir = 'src/components';
      createTestDir(testDir);

      // 검증 수행
      const result = validateFilePath(projectDir, testDir);

      // 디렉토리는 차단되어야 함
      expect(result.valid).toBe(false);
      expect(result.error).toContain('디렉토리는 다운로드할 수 없습니다');
    });
  });

  describe('Side Effects Tests', () => {
    it('should not modify file system state', () => {
      // 테스트 파일 생성
      const testFile = 'test.txt';
      createTestFile(testFile);

      // 파일 수정 시간 기록
      const fullPath = path.join(projectDir, testFile);
      const statBefore = fs.statSync(fullPath);

      // 검증 수행
      validateFilePath(projectDir, testFile);

      // 파일이 변경되지 않았는지 확인
      const statAfter = fs.statSync(fullPath);
      expect(statAfter.mtime.getTime()).toBe(statBefore.mtime.getTime());
      expect(statAfter.size).toBe(statBefore.size);
    });

    it('should return consistent results for same input', () => {
      // 테스트 파일 생성
      const testFile = 'consistent.txt';
      createTestFile(testFile);

      // 여러 번 호출
      const result1 = validateFilePath(projectDir, testFile);
      const result2 = validateFilePath(projectDir, testFile);
      const result3 = validateFilePath(projectDir, testFile);

      // 모든 결과가 동일해야 함
      expect(result1).toEqual(result2);
      expect(result2).toEqual(result3);
    });
  });

  describe('SENSITIVE_FILE_PATTERNS Tests', () => {
    it('should have correct number of patterns', () => {
      expect(SENSITIVE_FILE_PATTERNS).toHaveLength(10);
    });

    it('should match .env files', () => {
      const pattern = SENSITIVE_FILE_PATTERNS[0];
      expect(pattern.test('/project/.env')).toBe(true);
    });

    it('should match .env.* files', () => {
      const pattern = SENSITIVE_FILE_PATTERNS[1];
      expect(pattern.test('/project/.env.local')).toBe(true);
      expect(pattern.test('/project/.env.production')).toBe(true);
    });
  });

  describe('MAX_FILE_SIZE Constant', () => {
    it('should be 10MB', () => {
      expect(MAX_FILE_SIZE).toBe(10 * 1024 * 1024);
    });
  });
});
