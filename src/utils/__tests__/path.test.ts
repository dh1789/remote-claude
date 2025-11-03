/**
 * Path utility tests
 */

import {
  expandPath,
  toAbsolutePath,
  isSubdirectory,
  isSameRoot,
  validateProjectName,
} from '../path';
import * as os from 'os';
import * as path from 'path';

describe('Path Utilities', () => {
  describe('expandPath', () => {
    it('should expand home directory', () => {
      const result = expandPath('~/test');
      expect(result).toBe(path.join(os.homedir(), 'test'));
    });

    it('should handle ~ alone', () => {
      const result = expandPath('~');
      expect(result).toBe(os.homedir());
    });

    it('should not modify paths without ~', () => {
      const result = expandPath('/foo/bar');
      expect(result).toBe('/foo/bar');
    });
  });

  describe('toAbsolutePath', () => {
    it('should convert relative path to absolute', () => {
      const result = toAbsolutePath('.');
      expect(path.isAbsolute(result)).toBe(true);
    });

    it('should expand and convert home directory path', () => {
      const result = toAbsolutePath('~/test');
      expect(path.isAbsolute(result)).toBe(true);
      expect(result).toContain(os.homedir());
    });

    it('should normalize absolute paths', () => {
      const result = toAbsolutePath('/foo/bar/../baz');
      expect(result).toBe(path.resolve('/foo/bar/../baz'));
    });
  });

  describe('isSameRoot', () => {
    it('should return true for same paths', () => {
      const testPath = '/test/project';
      expect(isSameRoot(testPath, testPath)).toBe(true);
    });

    it('should return false for different paths', () => {
      expect(isSameRoot('/foo', '/bar')).toBe(false);
    });

    it('should normalize before comparison', () => {
      expect(isSameRoot('/foo/bar', '/foo/bar/.')).toBe(true);
      expect(isSameRoot('/foo/bar', '/foo/bar/../bar')).toBe(true);
    });
  });

  describe('isSubdirectory', () => {
    it('should return true for subdirectories', () => {
      expect(isSubdirectory('/foo/bar/baz', '/foo/bar')).toBe(true);
      expect(isSubdirectory('/project/src', '/project')).toBe(true);
    });

    it('should return false for parent directories', () => {
      expect(isSubdirectory('/foo/bar', '/foo/bar/baz')).toBe(false);
      expect(isSubdirectory('/project', '/project/src')).toBe(false);
    });

    it('should return false for same paths', () => {
      expect(isSubdirectory('/foo/bar', '/foo/bar')).toBe(false);
    });

    it('should return false for unrelated paths', () => {
      expect(isSubdirectory('/foo', '/bar')).toBe(false);
      expect(isSubdirectory('/project1', '/project2')).toBe(false);
    });

    it('should handle paths with similar prefixes correctly', () => {
      expect(isSubdirectory('/foobar', '/foo')).toBe(false);
      expect(isSubdirectory('/project-backup', '/project')).toBe(false);
    });
  });

  describe('validateProjectName', () => {
    it('should accept valid project names', () => {
      expect(() => validateProjectName('my-project')).not.toThrow();
      expect(() => validateProjectName('project_123')).not.toThrow();
      expect(() => validateProjectName('TestProject')).not.toThrow();
    });

    it('should reject empty names', () => {
      expect(() => validateProjectName('')).toThrow();
      expect(() => validateProjectName('   ')).toThrow();
    });

    it('should reject names with invalid characters', () => {
      expect(() => validateProjectName('my project')).toThrow();
      expect(() => validateProjectName('my@project')).toThrow();
      expect(() => validateProjectName('my#project')).toThrow();
    });

    it('should reject names that are too long', () => {
      const longName = 'a'.repeat(51);
      expect(() => validateProjectName(longName)).toThrow();
    });

    it('should accept names at maximum length', () => {
      const maxName = 'a'.repeat(50);
      expect(() => validateProjectName(maxName)).not.toThrow();
    });
  });
});
