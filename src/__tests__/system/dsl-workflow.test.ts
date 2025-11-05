/**
 * DSL 워크플로우 시스템 테스트
 * DSL Workflow System Tests
 *
 * 전체 워크플로우 통합 테스트
 * Full workflow integration tests
 *
 * Note: 이 시스템 테스트는 유닛 테스트로 충분히 커버된 기능들의 통합을 검증합니다.
 * 각 개별 기능은 유닛 테스트에서 상세히 테스트되었습니다.
 */

import { processInput } from '../../handlers/input-processor';
import { filterSlackMentions } from '../../handlers/mention-filter';
import { parseInteractiveCommand } from '../../dsl/parser';
import { initLogger, clearLoggerInstance } from '../../utils/logger';
import { LogLevel } from '../../types';

// Logger 초기화
beforeAll(() => {
  initLogger(LogLevel.ERROR);
});

// Logger 정리
afterAll(() => {
  clearLoggerInstance();
});

describe('DSL Workflow System Tests', () => {
  /**
   * Task 7.2-7.4: DSL 명령 처리 통합 테스트
   * Integration test for DSL command processing
   */
  describe('DSL Command Processing Integration', () => {
    it('Task 7.2: should process simple selection DSL command', () => {
      // Arrange
      const input = '`e`';

      // Act
      const processingResult = processInput(input);
      const parseResult = parseInteractiveCommand(input);

      // Assert: Input processing
      expect(processingResult.stage).toBe(3); // DSL command stage
      expect(processingResult.action).toBe('dsl-command');
      expect(processingResult.shouldProcess).toBe(true);

      // Assert: DSL parsing
      expect(parseResult.success).toBe(true);
      expect(parseResult.segments).toHaveLength(1);
      expect(parseResult.segments[0].type).toBe('key');
      expect((parseResult.segments[0] as any).key).toBe('Enter');
    });

    it('Task 7.2: should process multiple Down commands', () => {
      const input = '`ddd`';

      const processingResult = processInput(input);
      const parseResult = parseInteractiveCommand(input);

      expect(processingResult.stage).toBe(3);
      expect(parseResult.success).toBe(true);
      expect(parseResult.segments).toHaveLength(3);
      parseResult.segments.forEach((segment) => {
        expect(segment.type).toBe('key');
        expect((segment as any).key).toBe('Down');
      });
    });

    it('Task 7.3: should process mixed DSL command with text', () => {
      const input = '`ddd` custom value `e`';

      const processingResult = processInput(input);
      const parseResult = parseInteractiveCommand(input);

      expect(processingResult.stage).toBe(3);
      expect(parseResult.success).toBe(true);
      expect(parseResult.segments.length).toBeGreaterThanOrEqual(5);

      // Should contain Down keys, text, and Enter
      const hasDownKeys = parseResult.segments.some(
        (s) => s.type === 'key' && (s as any).key === 'Down'
      );
      const hasText = parseResult.segments.some((s) => s.type === 'text');
      const hasEnter = parseResult.segments.some(
        (s) => s.type === 'key' && (s as any).key === 'Enter'
      );

      expect(hasDownKeys).toBe(true);
      expect(hasText).toBe(true);
      expect(hasEnter).toBe(true);
    });

    it('Task 7.4: should detect mixed character error', () => {
      const input = '`ddx`';

      const processingResult = processInput(input);
      const parseResult = parseInteractiveCommand(input);

      // Note: When DSL parsing fails, it falls through to default input (stage 4)
      // This is expected behavior - invalid DSL is treated as regular text
      expect(processingResult.stage).toBe(4);
      expect(parseResult.success).toBe(false);
      expect(parseResult.error).toBeDefined();
      expect(parseResult.error?.message).toContain('애매');
    });

    it('Task 7.4: should execute valid command after error', () => {
      // First: invalid command
      const invalid = parseInteractiveCommand('`ddx`');
      expect(invalid.success).toBe(false);

      // Then: valid command
      const valid = parseInteractiveCommand('`dd`');
      expect(valid.success).toBe(true);
      expect(valid.segments).toHaveLength(2);
    });
  });

  /**
   * Task 7.5: Slack 멘션 필터링 통합 테스트
   * Integration test for Slack mention filtering
   */
  describe('Slack Mention Filtering Integration', () => {
    it('Task 7.5: should filter Slack mentions but preserve file references', () => {
      // Arrange: Slack mention + file reference
      const input = '<@U12345> @file.ts 파일 수정';

      // Act: Process through pipeline
      const processingResult = processInput(input);
      const mentionResult = filterSlackMentions(input);

      // Assert: Pipeline processing
      expect(processingResult.stage).toBe(4); // Default input stage
      expect(processingResult.action).toBe('default-input');
      expect(processingResult.shouldProcess).toBe(true);

      // Assert: Mention filtering
      expect(mentionResult.mentionsRemoved).toBe(1);
      expect(mentionResult.mentions).toContain('<@U12345>');
      expect(mentionResult.filteredText).toContain('@file.ts');
      expect(mentionResult.filteredText).toContain('파일 수정');
      expect(mentionResult.filteredText).not.toContain('<@U12345>');

      // Assert: Final processed input
      expect(processingResult.processedInput).toContain('@file.ts');
      expect(processingResult.processedInput).not.toContain('<@U12345>');
    });
  });

  /**
   * Task 7.6: 4단계 입력 처리 파이프라인 통합 테스트
   * Integration test for 4-stage input processing pipeline
   */
  describe('4-Stage Input Processing Pipeline Integration', () => {
    it('Task 7.6: should process inputs through correct stages', () => {
      // Test cases for each stage
      const testCases = [
        {
          input: '/remind me tomorrow',
          expectedStage: 1,
          expectedAction: 'passthrough',
          description: 'Slack native command',
        },
        {
          input: '/setup test /path',
          expectedStage: 2,
          expectedAction: 'bot-command',
          description: 'Bot meta command',
        },
        {
          input: '`ddd`',
          expectedStage: 3,
          expectedAction: 'dsl-command',
          description: 'DSL command',
        },
        {
          input: 'implement feature X',
          expectedStage: 4,
          expectedAction: 'default-input',
          description: 'Default input',
        },
      ];

      testCases.forEach(({ input, expectedStage, expectedAction }) => {
        const result = processInput(input);
        expect(result.stage).toBe(expectedStage);
        expect(result.action).toBe(expectedAction);
      });
    });

    it('Task 7.6: should prioritize stages correctly', () => {
      // Slack > Bot > DSL > Default
      const slackResult = processInput('/remind test');
      expect(slackResult.stage).toBe(1);

      const botResult = processInput('/status');
      expect(botResult.stage).toBe(2);

      const dslResult = processInput('`e`');
      expect(dslResult.stage).toBe(3);

      const defaultResult = processInput('regular text');
      expect(defaultResult.stage).toBe(4);
    });
  });

  /**
   * Task 7.7: 성능 측정 통합 테스트
   * Performance measurement integration test
   */
  describe('Performance Measurement', () => {
    it('Task 7.7: should complete processing within performance budget', () => {
      const inputs = [
        '`e`',
        '`ddd`',
        '`ddd` text `e`',
        'implement feature',
        '<@U12345> @file.ts fix',
      ];

      inputs.forEach((input) => {
        const startTime = Date.now();

        // Process input
        processInput(input);

        // Parse if DSL
        if (input.includes('`')) {
          parseInteractiveCommand(input);
        }

        const duration = Date.now() - startTime;

        // Assert: Processing should be fast (<100ms)
        expect(duration).toBeLessThan(100);
      });
    });
  });

  /**
   * Task 7.8: 에러 조건 통합 테스트
   * Error condition integration test
   */
  describe('Error Handling Integration', () => {
    it('Task 7.8: should handle empty input gracefully', () => {
      const result = processInput('');

      expect(result.stage).toBe(4);
      expect(result.shouldProcess).toBe(false);
      expect(result.processedInput).toBe('');
    });

    it('Task 7.8: should handle whitespace-only input', () => {
      const result = processInput('   ');

      expect(result.stage).toBe(4);
      expect(result.shouldProcess).toBe(false);
      expect(result.processedInput).toBe('');
    });

    it('Task 7.8: should handle input that becomes empty after filtering', () => {
      const result = processInput('<@U12345> <!channel>');

      expect(result.stage).toBe(4);
      expect(result.shouldProcess).toBe(false);
      expect(result.processedInput).toBe('');
      expect(result.metadata?.mentionFilterResult?.mentionsRemoved).toBe(2);
    });

    it('Task 7.8: should handle DSL parsing errors', () => {
      const inputs = ['`ddx`', '`hello_e`', '`u1234`'];

      inputs.forEach((input) => {
        const parseResult = parseInteractiveCommand(input);
        expect(parseResult.success).toBe(false);
        expect(parseResult.error).toBeDefined();
      });
    });
  });

  /**
   * 전체 워크플로우 통합 시나리오
   * End-to-end workflow scenarios
   */
  describe('End-to-End Workflow Scenarios', () => {
    it('should handle complete user interaction workflow', () => {
      // Scenario: User sends message with mention and DSL command
      const userInput = '<@UBOT123> `ddd` select option `e`';

      // Stage 1: Input processing
      const processingResult = processInput(userInput);
      expect(processingResult.stage).toBe(3); // DSL command detected
      expect(processingResult.shouldProcess).toBe(true);

      // Stage 2: DSL parsing
      const parseResult = parseInteractiveCommand(userInput);
      expect(parseResult.success).toBe(true);
      expect(parseResult.segments.length).toBeGreaterThan(0);

      // Stage 3: Verify command sequence
      const downCommands = parseResult.segments.filter(
        (s) => s.type === 'key' && (s as any).key === 'Down'
      );
      const textCommands = parseResult.segments.filter((s) => s.type === 'text');
      const enterCommands = parseResult.segments.filter(
        (s) => s.type === 'key' && (s as any).key === 'Enter'
      );

      expect(downCommands.length).toBe(3);
      expect(textCommands.length).toBeGreaterThan(0);
      expect(enterCommands.length).toBe(1);
    });

    it('should handle error recovery workflow', () => {
      // Scenario: User makes error, then corrects it

      // Step 1: User sends invalid DSL
      const invalidInput = '`ddx`';
      const invalidResult = parseInteractiveCommand(invalidInput);
      expect(invalidResult.success).toBe(false);

      // Step 2: User sends valid DSL
      const validInput = '`dd`';
      const validResult = parseInteractiveCommand(validInput);
      expect(validResult.success).toBe(true);
      expect(validResult.segments).toHaveLength(2);
    });
  });
});
