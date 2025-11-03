/**
 * tmux 출력 파싱 유틸리티
 * tmux output parsing utilities
 */

import { CaptureResult } from '../types';

/**
 * ANSI 이스케이프 코드 제거
 * Remove ANSI escape codes from text
 *
 * ANSI 코드 패턴:
 * - \x1b[ ... m (색상)
 * - \x1b[ ... H (커서 이동)
 * - \x1b[ ... J (화면 지우기)
 * - 기타 제어 문자들
 */
export function removeAnsiCodes(text: string): string {
  // ANSI escape sequences 제거
  // eslint-disable-next-line no-control-regex
  return text
    .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '') // CSI sequences
    .replace(/\x1b\][^\x07]*\x07/g, '') // OSC sequences
    .replace(/\x1b[=>]/g, '') // Mode changes
    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Other control characters (except \t, \n, \r)
}

/**
 * 출력 정리
 * Clean output text
 *
 * - ANSI 코드 제거
 * - 빈 줄 제거
 * - 앞뒤 공백 제거
 */
export function cleanOutput(text: string): string {
  const cleaned = removeAnsiCodes(text);

  // 줄 단위로 처리
  const lines = cleaned.split('\n').map((line) => line.trimEnd());

  // 앞뒤 빈 줄 제거
  let startIndex = 0;
  let endIndex = lines.length - 1;

  while (startIndex < lines.length && lines[startIndex].trim() === '') {
    startIndex++;
  }

  while (endIndex >= 0 && lines[endIndex].trim() === '') {
    endIndex--;
  }

  if (startIndex > endIndex) {
    return '';
  }

  return lines.slice(startIndex, endIndex + 1).join('\n');
}

/**
 * 출력 캡처 결과 처리
 * Process capture result
 *
 * - ANSI 코드 제거
 * - 긴 출력 처리 (처음 N줄 + 마지막 M줄)
 * - 전체 출력 및 요약 반환
 *
 * @param output - Raw output from tmux capture-pane
 * @param firstLines - Number of first lines to include (default: 100)
 * @param lastLines - Number of last lines to include (default: 50)
 * @returns CaptureResult with full output and summary
 */
export function processCaptureResult(
  output: string,
  firstLines: number = 100,
  lastLines: number = 50
): CaptureResult {
  // 1. ANSI 코드 제거 및 정리
  const fullOutput = cleanOutput(output);

  // 2. 줄 단위로 분리
  const lines = fullOutput.split('\n');
  const totalLines = lines.length;

  // 3. 긴 출력 여부 확인
  if (totalLines <= firstLines + lastLines) {
    // 전체 출력이 충분히 짧으면 그대로 반환
    return {
      fullOutput,
      summary: fullOutput,
      isTruncated: false,
      totalLines,
    };
  }

  // 4. 긴 출력 처리: 처음 N줄 + 마지막 M줄만 표시
  const firstPart = lines.slice(0, firstLines);
  const lastPart = lines.slice(-lastLines);
  const omittedLines = totalLines - firstLines - lastLines;

  const summary =
    firstPart.join('\n') +
    `\n\n... (중간 ${omittedLines}줄 생략) ...\n\n` +
    lastPart.join('\n');

  return {
    fullOutput,
    summary,
    isTruncated: true,
    totalLines,
  };
}

/**
 * 출력이 완료되었는지 감지
 * Detect if output is complete (no changes)
 *
 * @param previousOutput - Previous output
 * @param currentOutput - Current output
 * @returns true if output hasn't changed
 */
export function isOutputStable(
  previousOutput: string,
  currentOutput: string
): boolean {
  // ANSI 코드 제거 후 비교
  const cleanPrev = cleanOutput(previousOutput);
  const cleanCurr = cleanOutput(currentOutput);

  return cleanPrev === cleanCurr;
}

/**
 * Claude Code 프롬프트 감지
 * Detect if Claude Code is waiting for input (y/n prompt)
 *
 * Claude Code가 대화형 응답을 기다리는 패턴:
 * - "Continue?" 또는 유사한 프롬프트
 * - "[y/n]" 패턴
 */
export function detectInteractivePrompt(output: string): boolean {
  const cleaned = cleanOutput(output);
  const lastLines = cleaned.split('\n').slice(-5).join('\n').toLowerCase();

  // 대화형 프롬프트 패턴 감지
  const patterns = [
    /\[y\/n\]/i,
    /continue\?/i,
    /proceed\?/i,
    /do you want to/i,
    /would you like to/i,
  ];

  return patterns.some((pattern) => pattern.test(lastLines));
}

/**
 * 에러 메시지 감지
 * Detect error messages in output
 */
export function detectError(output: string): boolean {
  const cleaned = cleanOutput(output).toLowerCase();

  const errorPatterns = [
    /error:/i,
    /exception:/i,
    /fatal:/i,
    /failed:/i,
    /cannot/i,
    /unable to/i,
  ];

  return errorPatterns.some((pattern) => pattern.test(cleaned));
}

/**
 * 작업 완료 감지
 * Detect if task is completed
 *
 * Claude Code가 작업을 완료했는지 판단하는 패턴:
 * - 명령 프롬프트 재출현
 * - 완료 메시지
 */
export function detectCompletion(output: string): boolean {
  const cleaned = cleanOutput(output);
  const lastLines = cleaned.split('\n').slice(-3).join('\n');

  // 완료 패턴 감지
  const completionPatterns = [
    /task completed/i,
    /done/i,
    /finished/i,
    /success/i,
  ];

  return completionPatterns.some((pattern) => pattern.test(lastLines));
}
