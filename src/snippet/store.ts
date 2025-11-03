/**
 * Snippet Store 클래스
 * Snippet store for prompt snippets
 */

import * as fs from 'fs';
import * as path from 'path';
import { SnippetStore, Snippet } from '../types';
import { getLogger } from '../utils/logger';

/**
 * Snippet Store 클래스
 * Manages snippets file (snippets.json) with CRUD operations
 */
export class SnippetStoreManager {
  private snippetFilePath: string;
  private store: SnippetStore;

  /**
   * SnippetStoreManager 생성자
   * @param configDir - Configuration directory path
   */
  constructor(configDir: string) {
    this.snippetFilePath = path.join(configDir, 'snippets.json');
    this.store = this.loadStore();
  }

  /**
   * 스니펫 파일 로드
   * Load snippets from file
   */
  private loadStore(): SnippetStore {
    const logger = getLogger();

    if (!fs.existsSync(this.snippetFilePath)) {
      logger.warn(`Snippet file not found: ${this.snippetFilePath}`);
      return { snippets: {} };
    }

    try {
      const data = fs.readFileSync(this.snippetFilePath, 'utf-8');
      const store = JSON.parse(data) as SnippetStore;
      logger.debug(`Snippets loaded from ${this.snippetFilePath}`);
      return store;
    } catch (error) {
      logger.error(`Failed to load snippet file: ${error}`);
      return { snippets: {} };
    }
  }

  /**
   * 스니펫 파일 저장
   * Save snippets to file
   */
  private saveStore(): void {
    const logger = getLogger();

    try {
      const data = JSON.stringify(this.store, null, 2);
      fs.writeFileSync(this.snippetFilePath, data, 'utf-8');
      logger.debug(`Snippets saved to ${this.snippetFilePath}`);
    } catch (error) {
      logger.error(`Failed to save snippet file: ${error}`);
      throw error;
    }
  }

  /**
   * 스니펫 추가 또는 업데이트
   * Add or update snippet
   *
   * @param name - Snippet name
   * @param prompt - Prompt text
   */
  public setSnippet(name: string, prompt: string): void {
    const logger = getLogger();

    const isUpdate = this.store.snippets[name] !== undefined;

    this.store.snippets[name] = prompt;
    this.saveStore();

    if (isUpdate) {
      logger.info(`Snippet updated: ${name}`);
    } else {
      logger.info(`Snippet added: ${name}`);
    }
  }

  /**
   * 스니펫 가져오기
   * Get snippet by name
   *
   * @param name - Snippet name
   * @returns Prompt text or undefined if not found
   */
  public getSnippet(name: string): string | undefined {
    return this.store.snippets[name];
  }

  /**
   * 스니펫 존재 여부 확인
   * Check if snippet exists
   */
  public hasSnippet(name: string): boolean {
    return this.store.snippets[name] !== undefined;
  }

  /**
   * 스니펫 삭제
   * Delete snippet
   *
   * @param name - Snippet name
   * @returns true if deleted, false if snippet not found
   */
  public deleteSnippet(name: string): boolean {
    const logger = getLogger();

    if (!this.hasSnippet(name)) {
      logger.warn(`Snippet not found: ${name}`);
      return false;
    }

    delete this.store.snippets[name];
    this.saveStore();

    logger.info(`Snippet deleted: ${name}`);
    return true;
  }

  /**
   * 모든 스니펫 가져오기
   * Get all snippets
   *
   * @returns Array of Snippet objects
   */
  public getAllSnippets(): Snippet[] {
    return Object.entries(this.store.snippets).map(([name, prompt]) => ({
      name,
      prompt,
    }));
  }

  /**
   * 스니펫 이름 목록 가져오기
   * Get all snippet names
   */
  public getSnippetNames(): string[] {
    return Object.keys(this.store.snippets);
  }

  /**
   * 스니펫 개수 가져오기
   * Get number of snippets
   */
  public getSnippetCount(): number {
    return Object.keys(this.store.snippets).length;
  }

  /**
   * 스니펫 검색
   * Search snippets by keyword
   *
   * @param keyword - Search keyword (case-insensitive)
   * @returns Array of matching snippets
   */
  public searchSnippets(keyword: string): Snippet[] {
    const lowerKeyword = keyword.toLowerCase();

    return this.getAllSnippets().filter(
      (snippet) =>
        snippet.name.toLowerCase().includes(lowerKeyword) ||
        snippet.prompt.toLowerCase().includes(lowerKeyword)
    );
  }

  /**
   * 모든 스니펫 삭제
   * Clear all snippets
   *
   * WARNING: This will delete all snippets!
   */
  public clearAllSnippets(): void {
    const logger = getLogger();

    this.store.snippets = {};
    this.saveStore();

    logger.warn('All snippets cleared');
  }

  /**
   * 스니펫 저장소 새로고침
   * Refresh snippets from file
   */
  public refresh(): void {
    this.store = this.loadStore();
  }
}
