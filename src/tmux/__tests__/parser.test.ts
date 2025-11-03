/**
 * tmux Parser tests
 */

import {
  removeAnsiCodes,
  processCaptureResult,
  detectInteractivePrompt,
} from '../parser';

describe('tmux Parser', () => {
  describe('removeAnsiCodes', () => {
    it('should remove CSI sequences', () => {
      const input = '\x1b[31mRed text\x1b[0m';
      const output = removeAnsiCodes(input);
      expect(output).toBe('Red text');
    });

    it('should remove OSC sequences', () => {
      const input = '\x1b]0;Title\x07Normal text';
      const output = removeAnsiCodes(input);
      expect(output).toBe('Normal text');
    });

    it('should remove multiple ANSI codes', () => {
      const input = '\x1b[1m\x1b[31mBold Red\x1b[0m\x1b[32mGreen\x1b[0m';
      const output = removeAnsiCodes(input);
      expect(output).toBe('Bold RedGreen');
    });

    it('should handle text without ANSI codes', () => {
      const input = 'Plain text';
      const output = removeAnsiCodes(input);
      expect(output).toBe('Plain text');
    });

    it('should handle empty string', () => {
      const output = removeAnsiCodes('');
      expect(output).toBe('');
    });
  });

  describe('processCaptureResult', () => {
    it('should return full output when within limits', () => {
      const lines = Array(50).fill('test line');
      const input = lines.join('\n');

      const result = processCaptureResult(input, 100, 50);

      expect(result.isTruncated).toBe(false);
      expect(result.totalLines).toBe(50);
      expect(result.summary).toContain('test line');
    });

    it('should truncate long output', () => {
      const lines = Array(200).fill('test line');
      lines[0] = 'first line';
      lines[199] = 'last line';
      const input = lines.join('\n');

      const result = processCaptureResult(input, 100, 50);

      expect(result.isTruncated).toBe(true);
      expect(result.totalLines).toBe(200);
      expect(result.summary).toContain('first line');
      expect(result.summary).toContain('last line');
      expect(result.summary).toContain('... (중간 50줄 생략)');
    });

    it('should handle empty output', () => {
      const result = processCaptureResult('');

      expect(result.isTruncated).toBe(false);
      // Empty string results in 1 line (the empty line itself)
      expect(result.totalLines).toBe(1);
      expect(result.summary).toBe('');
    });

    it('should remove ANSI codes from output', () => {
      const input = '\x1b[31mRed line\x1b[0m\n\x1b[32mGreen line\x1b[0m';
      const result = processCaptureResult(input);

      expect(result.summary).not.toContain('\x1b');
      expect(result.summary).toContain('Red line');
      expect(result.summary).toContain('Green line');
    });

    it('should use custom first and last line counts', () => {
      const lines = Array(100).fill('test');
      lines[0] = 'first';
      lines[99] = 'last';
      const input = lines.join('\n');

      const result = processCaptureResult(input, 10, 10);

      expect(result.isTruncated).toBe(true);
      expect(result.summary).toContain('first');
      expect(result.summary).toContain('last');
      expect(result.summary).toContain('... (중간 80줄 생략)');
    });

    it('should handle output with only newlines', () => {
      const input = '\n\n\n\n\n';
      const result = processCaptureResult(input);

      // split() on a string with only newlines results in empty strings
      expect(result.totalLines).toBeGreaterThan(0);
      expect(result.isTruncated).toBe(false);
    });
  });

  describe('detectInteractivePrompt', () => {
    it('should detect [y/n] prompt', () => {
      const output = 'Do you want to continue? [y/n]';
      expect(detectInteractivePrompt(output)).toBe(true);
    });

    it('should detect [Y/N] prompt (uppercase)', () => {
      const output = 'Proceed with deletion? [Y/N]';
      expect(detectInteractivePrompt(output)).toBe(true);
    });

    it('should detect continue? prompt', () => {
      const output = 'Continue?';
      expect(detectInteractivePrompt(output)).toBe(true);
    });

    it('should detect proceed? prompt', () => {
      const output = 'Proceed?';
      expect(detectInteractivePrompt(output)).toBe(true);
    });

    it('should detect prompts in multi-line output', () => {
      const output = 'Some output\nMore output\nDo you want to continue? [y/n]\n';
      expect(detectInteractivePrompt(output)).toBe(true);
    });

    it('should return false for non-interactive output', () => {
      const output = 'Build completed successfully';
      expect(detectInteractivePrompt(output)).toBe(false);
    });

    it('should return false for empty output', () => {
      expect(detectInteractivePrompt('')).toBe(false);
    });

    it('should detect case-insensitive patterns', () => {
      expect(detectInteractivePrompt('CONTINUE?')).toBe(true);
      expect(detectInteractivePrompt('proceed?')).toBe(true);
      expect(detectInteractivePrompt('[Y/n]')).toBe(true);
    });

    it('should detect prompts with ANSI codes', () => {
      const output = '\x1b[33mDo you want to continue? [y/n]\x1b[0m';
      expect(detectInteractivePrompt(output)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle very long lines', () => {
      const longLine = 'x'.repeat(10000);
      const input = [longLine, 'short line'].join('\n');

      const result = processCaptureResult(input);
      expect(result.totalLines).toBe(2);
      expect(result.summary).toContain('short line');
    });

    it('should handle mixed line endings', () => {
      const input = 'line1\r\nline2\nline3\r\nline4';
      const result = processCaptureResult(input);

      expect(result.totalLines).toBeGreaterThan(0);
    });

    it('should handle special characters', () => {
      const input = 'Test with émojis 🚀 and spëcial chârs';
      const result = processCaptureResult(input);

      expect(result.summary).toContain('🚀');
      expect(result.summary).toContain('émojis');
    });
  });
});
