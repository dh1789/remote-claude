#!/usr/bin/env node
/**
 * 파일 해시 검증 유틸리티
 * File hash verification utility
 *
 * 두 파일의 SHA-256 해시를 비교하여 파일이 동일한지 검증합니다.
 * 사용법: node verify-file-hash.js <original-file> <downloaded-file>
 */

const fs = require('fs');
const crypto = require('crypto');
const path = require('path');

/**
 * 파일의 SHA-256 해시 계산
 * Calculate SHA-256 hash of a file
 *
 * @param {string} filePath - 해시를 계산할 파일 경로
 * @returns {string} SHA-256 해시 값 (hex)
 */
function calculateFileHash(filePath) {
  try {
    const fileContent = fs.readFileSync(filePath);
    const hash = crypto.createHash('sha256').update(fileContent).digest('hex');
    return hash;
  } catch (error) {
    throw new Error(`파일 읽기 실패: ${filePath} - ${error.message}`);
  }
}

/**
 * 파일 정보 출력
 * Print file information
 *
 * @param {string} filePath - 정보를 출력할 파일 경로
 * @param {string} hash - 파일의 SHA-256 해시 값
 */
function printFileInfo(filePath, hash) {
  const stats = fs.statSync(filePath);
  const fileName = path.basename(filePath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);

  console.log(`\n📄 파일: ${fileName}`);
  console.log(`  경로: ${filePath}`);
  console.log(`  크기: ${fileSizeKB} KB`);
  console.log(`  SHA-256: ${hash}`);
}

/**
 * 두 파일의 해시 비교
 * Compare hashes of two files
 *
 * @param {string} originalPath - 원본 파일 경로
 * @param {string} downloadedPath - 다운로드된 파일 경로
 * @returns {boolean} 파일이 동일하면 true, 다르면 false
 */
function verifyFileHash(originalPath, downloadedPath) {
  console.log('🔍 파일 해시 검증 시작...');

  // 파일 존재 여부 확인
  if (!fs.existsSync(originalPath)) {
    console.error(`❌ 원본 파일을 찾을 수 없습니다: ${originalPath}`);
    return false;
  }

  if (!fs.existsSync(downloadedPath)) {
    console.error(`❌ 다운로드된 파일을 찾을 수 없습니다: ${downloadedPath}`);
    return false;
  }

  // 해시 계산
  try {
    const originalHash = calculateFileHash(originalPath);
    const downloadedHash = calculateFileHash(downloadedPath);

    // 파일 정보 출력
    console.log('\n--- 원본 파일 ---');
    printFileInfo(originalPath, originalHash);

    console.log('\n--- 다운로드된 파일 ---');
    printFileInfo(downloadedPath, downloadedHash);

    // 해시 비교
    console.log('\n--- 검증 결과 ---');
    if (originalHash === downloadedHash) {
      console.log('✅ 파일 해시가 일치합니다!');
      console.log('✅ 파일이 정상적으로 다운로드되었습니다.');
      return true;
    } else {
      console.log('❌ 파일 해시가 일치하지 않습니다!');
      console.log('❌ 파일이 손상되었거나 변경되었습니다.');
      console.log(`\n원본 해시:      ${originalHash}`);
      console.log(`다운로드 해시:  ${downloadedHash}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ 해시 계산 중 오류 발생: ${error.message}`);
    return false;
  }
}

/**
 * 사용법 안내
 * Print usage information
 */
function printUsage() {
  console.log('사용법: node verify-file-hash.js <original-file> <downloaded-file>');
  console.log('');
  console.log('예시:');
  console.log('  node verify-file-hash.js \\');
  console.log('    tests/system/test-project/logs/test-app.log \\');
  console.log('    ~/Downloads/test-app.log');
  console.log('');
  console.log('설명:');
  console.log('  이 스크립트는 원본 파일과 다운로드된 파일의 SHA-256 해시를 비교하여');
  console.log('  파일이 정상적으로 다운로드되었는지 검증합니다.');
}

/**
 * 메인 함수
 * Main function
 */
function main() {
  const args = process.argv.slice(2);

  // 인자 검증
  if (args.length !== 2) {
    console.error('❌ 인자 개수가 올바르지 않습니다.\n');
    printUsage();
    process.exit(1);
  }

  const [originalPath, downloadedPath] = args;

  // 파일 해시 검증 실행
  const isValid = verifyFileHash(originalPath, downloadedPath);

  // 종료 코드 설정
  process.exit(isValid ? 0 : 1);
}

// 스크립트 실행
if (require.main === module) {
  main();
}

module.exports = {
  calculateFileHash,
  verifyFileHash,
};
