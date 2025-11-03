/**
 * 경로 검증 및 처리 유틸리티
 * Path validation and processing utilities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * 경로에서 ~ 를 홈 디렉토리로 확장
 * Expand ~ to home directory in path
 */
export function expandPath(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/**
 * 경로를 절대 경로로 변환
 * Convert path to absolute path
 */
export function toAbsolutePath(filePath: string): string {
  const expanded = expandPath(filePath);
  return path.resolve(expanded);
}

/**
 * 경로가 존재하는지 확인
 * Check if path exists
 */
export function pathExists(filePath: string): boolean {
  return fs.existsSync(filePath);
}

/**
 * 경로가 디렉토리인지 확인
 * Check if path is a directory
 */
export function isDirectory(filePath: string): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

/**
 * 경로 검증
 * Validate path for project setup
 *
 * @param projectPath - Path to validate
 * @throws Error if path is invalid
 */
export function validateProjectPath(projectPath: string): void {
  const absolutePath = toAbsolutePath(projectPath);

  // 경로가 존재하는지 확인
  if (!pathExists(absolutePath)) {
    throw new Error(
      `경로가 존재하지 않습니다: ${absolutePath}\n` +
      `Path does not exist: ${absolutePath}`
    );
  }

  // 디렉토리인지 확인
  if (!isDirectory(absolutePath)) {
    throw new Error(
      `경로가 디렉토리가 아닙니다: ${absolutePath}\n` +
      `Path is not a directory: ${absolutePath}`
    );
  }

  // 읽기 권한 확인
  try {
    fs.accessSync(absolutePath, fs.constants.R_OK);
  } catch {
    throw new Error(
      `경로에 대한 읽기 권한이 없습니다: ${absolutePath}\n` +
      `No read permission for path: ${absolutePath}`
    );
  }
}

/**
 * 두 경로가 같은 루트인지 확인
 * Check if two paths share the same root (not allowed)
 *
 * 같은 루트 경로는 허용하지 않지만, 하위 디렉토리는 허용
 * Same root path not allowed, but subdirectories are allowed
 *
 * 예시:
 * - /project 와 /project → 같은 루트 (불가)
 * - /project 와 /project/frontend → 하위 디렉토리 (가능)
 * - /project/frontend 와 /project/backend → 다른 디렉토리 (가능)
 */
export function isSameRoot(path1: string, path2: string): boolean {
  const abs1 = toAbsolutePath(path1);
  const abs2 = toAbsolutePath(path2);

  // 정확히 같은 경로인지 확인
  return abs1 === abs2;
}

/**
 * 경로가 다른 경로의 하위 디렉토리인지 확인
 * Check if path1 is a subdirectory of path2
 */
export function isSubdirectory(path1: string, path2: string): boolean {
  const abs1 = toAbsolutePath(path1);
  const abs2 = toAbsolutePath(path2);

  // path1이 path2로 시작하고, path1 !== path2 이면 하위 디렉토리
  const relative = path.relative(abs2, abs1);
  return relative !== '' && !relative.startsWith('..') && abs1 !== abs2;
}

/**
 * 경로 충돌 검증
 * Validate path conflicts with existing paths
 *
 * 규칙:
 * - 같은 루트 경로는 불가 (isSameRoot)
 * - 하위 디렉토리는 가능 (isSubdirectory)
 *
 * @param newPath - New path to validate
 * @param existingPaths - Array of existing paths
 * @throws Error if path conflicts with existing paths
 */
export function validatePathConflicts(
  newPath: string,
  existingPaths: string[]
): void {
  const absNewPath = toAbsolutePath(newPath);

  for (const existingPath of existingPaths) {
    const absExistingPath = toAbsolutePath(existingPath);

    // 같은 루트 경로는 허용하지 않음
    if (isSameRoot(absNewPath, absExistingPath)) {
      throw new Error(
        `이미 사용 중인 경로입니다: ${absExistingPath}\n` +
        `Path is already in use: ${absExistingPath}`
      );
    }
  }
}

/**
 * 프로젝트 이름 검증
 * Validate project name
 *
 * 규칙:
 * - 알파벳, 숫자, 하이픈, 언더스코어만 허용
 * - 1-50자
 */
export function validateProjectName(projectName: string): void {
  if (!projectName || projectName.trim().length === 0) {
    throw new Error(
      '프로젝트 이름이 비어있습니다.\n' +
      'Project name is empty.'
    );
  }

  if (projectName.length > 50) {
    throw new Error(
      '프로젝트 이름이 너무 깁니다. (최대 50자)\n' +
      'Project name is too long. (max 50 characters)'
    );
  }

  const validPattern = /^[a-zA-Z0-9\-_]+$/;
  if (!validPattern.test(projectName)) {
    throw new Error(
      '프로젝트 이름은 알파벳, 숫자, 하이픈(-), 언더스코어(_)만 사용 가능합니다.\n' +
      'Project name can only contain letters, numbers, hyphens, and underscores.'
    );
  }
}
