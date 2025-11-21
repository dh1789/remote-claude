/**
 * Unified Slack Message Sender Tests
 * TDD: Red → Green → Refactor
 */

import { App } from '@slack/bolt';
import { sendSlackMessage } from '../slack-messenger';

// Mock Slack App
const createMockApp = () => {
  const mockPostMessage = jest.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });
  const mockUpdate = jest.fn().mockResolvedValue({ ok: true, ts: '1234567890.123456' });

  return {
    client: {
      chat: {
        postMessage: mockPostMessage,
        update: mockUpdate,
      },
    },
    _mockPostMessage: mockPostMessage,
    _mockUpdate: mockUpdate,
  } as unknown as App & {
    _mockPostMessage: jest.Mock;
    _mockUpdate: jest.Mock;
  };
};

describe('sendSlackMessage', () => {
  describe('Test 1: 짧은 메시지는 일반 전송', () => {
    it('should send short message with single postMessage call', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const shortMessage = '안녕하세요, 테스트 메시지입니다.'; // ~20자

      // Act
      await sendSlackMessage(app, channelId, shortMessage);

      // Assert
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: channelId,
          text: shortMessage,
        })
      );
    });

    it('should send 1000-character message with single postMessage call', async () => {
      // Arrange
      const app = createMockApp();
      const channelId = 'C123456';
      const message1000 = 'A'.repeat(1000); // 1000자

      // Act
      await sendSlackMessage(app, channelId, message1000);

      // Assert
      expect(app._mockPostMessage).toHaveBeenCalledTimes(1);
      expect(app._mockPostMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: channelId,
          text: message1000,
        })
      );
    });
  });
});
