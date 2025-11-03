/**
 * Job Queue tests
 */

import { JobQueue } from '../queue';
import { JobType, JobStatus, LogLevel } from '../../types';
import { initLogger, clearLoggerInstance } from '../../utils/logger';

describe('JobQueue', () => {
  let jobQueue: JobQueue;

  beforeEach(() => {
    initLogger(LogLevel.ERROR); // Use ERROR level to suppress logs during tests
    jobQueue = new JobQueue();
  });

  afterEach(() => {
    clearLoggerInstance();
  });

  describe('addJob', () => {
    it('should add a job to the queue', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test prompt');

      expect(job.id).toBeDefined();
      expect(job.channelId).toBe('C12345');
      expect(job.type).toBe(JobType.ASK_PROMPT);
      expect(job.prompt).toBe('test prompt');
      expect(job.status).toBe(JobStatus.PENDING);
      expect(job.createdAt).toBeDefined();
    });

    it('should generate unique job IDs', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      const job2 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');

      expect(job1.id).not.toBe(job2.id);
    });

    it('should add jobs to channel-specific queues', () => {
      jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      jobQueue.addJob('C67890', JobType.ASK_PROMPT, 'test2');

      const summary1 = jobQueue.getQueueSummary('C12345');
      const summary2 = jobQueue.getQueueSummary('C67890');

      expect(summary1.pending).toBe(1);
      expect(summary2.pending).toBe(1);
    });
  });

  describe('getNextJob', () => {
    it('should return next pending job', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');

      const next = jobQueue.getNextJob('C12345');
      expect(next?.id).toBe(job1.id);
    });

    it('should return undefined if no pending jobs', () => {
      const next = jobQueue.getNextJob('C12345');
      expect(next).toBeUndefined();
    });

    it('should skip non-pending jobs', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      const job2 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');

      jobQueue.updateJobStatus(job1.id, JobStatus.COMPLETED);

      const next = jobQueue.getNextJob('C12345');
      expect(next?.id).toBe(job2.id);
    });

    it('should maintain FIFO order', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      const job2 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');
      const job3 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test3');

      expect(jobQueue.getNextJob('C12345')?.id).toBe(job1.id);
      jobQueue.updateJobStatus(job1.id, JobStatus.RUNNING);

      expect(jobQueue.getNextJob('C12345')?.id).toBe(job2.id);
      jobQueue.updateJobStatus(job2.id, JobStatus.RUNNING);

      expect(jobQueue.getNextJob('C12345')?.id).toBe(job3.id);
    });
  });

  describe('updateJobStatus', () => {
    it('should update job status to RUNNING', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');

      jobQueue.updateJobStatus(job.id, JobStatus.RUNNING);

      expect(job.status).toBe(JobStatus.RUNNING);
      expect(job.startedAt).toBeDefined();
    });

    it('should update job status to COMPLETED', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');
      jobQueue.updateJobStatus(job.id, JobStatus.RUNNING);
      jobQueue.updateJobStatus(job.id, JobStatus.COMPLETED);

      expect(job.status).toBe(JobStatus.COMPLETED);
      expect(job.completedAt).toBeDefined();
    });

    it('should update job status to FAILED with error', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');
      jobQueue.updateJobStatus(job.id, JobStatus.FAILED, 'Test error');

      expect(job.status).toBe(JobStatus.FAILED);
      expect(job.error).toBe('Test error');
      expect(job.completedAt).toBeDefined();
    });

    it('should silently ignore non-existent job', () => {
      // Implementation doesn't throw for non-existent jobs
      expect(() => {
        jobQueue.updateJobStatus('non-existent', JobStatus.COMPLETED);
      }).not.toThrow();
    });
  });

  describe('cancelJob', () => {
    it('should cancel a job', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');

      jobQueue.cancelJob(job.id);

      expect(job.status).toBe(JobStatus.CANCELLED);
      expect(job.completedAt).toBeDefined();
    });

    it('should silently ignore non-existent job', () => {
      // Implementation doesn't throw for non-existent jobs
      expect(() => {
        jobQueue.cancelJob('non-existent');
      }).not.toThrow();
    });
  });

  describe('getJob', () => {
    it('should return job by ID', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');
      const retrieved = jobQueue.getJob(job.id);

      expect(retrieved?.id).toBe(job.id);
      expect(retrieved?.prompt).toBe('test');
    });

    it('should return undefined for non-existent job', () => {
      const retrieved = jobQueue.getJob('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('getQueueSummary', () => {
    it('should return summary with all job statuses', () => {
      jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1'); // PENDING
      const job2 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');
      const job3 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test3');
      const job4 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test4');
      const job5 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test5');

      jobQueue.updateJobStatus(job2.id, JobStatus.RUNNING);
      jobQueue.updateJobStatus(job3.id, JobStatus.COMPLETED);
      jobQueue.updateJobStatus(job4.id, JobStatus.FAILED);
      jobQueue.cancelJob(job5.id);

      const summary = jobQueue.getQueueSummary('C12345');

      expect(summary.pending).toBe(1);
      expect(summary.running).toBe(1);
      expect(summary.completed).toBe(1);
      expect(summary.failed).toBe(1);
      expect(summary.cancelled).toBe(1);
    });

    it('should return zero counts for empty queue', () => {
      const summary = jobQueue.getQueueSummary('C12345');

      expect(summary.pending).toBe(0);
      expect(summary.running).toBe(0);
      expect(summary.completed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.cancelled).toBe(0);
    });
  });

  describe('cleanupCompletedJobs', () => {
    it('should remove jobs older than threshold', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      jobQueue.updateJobStatus(job1.id, JobStatus.COMPLETED);

      // Manually set old timestamp (25 hours ago)
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);
      job1.completedAt = oldDate.toISOString();

      const removed = jobQueue.cleanupCompletedJobs(24);
      expect(removed).toBe(1);

      const retrieved = jobQueue.getJob(job1.id);
      expect(retrieved).toBeUndefined();
    });

    it('should not remove recent completed jobs', () => {
      const job = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test');
      jobQueue.updateJobStatus(job.id, JobStatus.COMPLETED);

      const removed = jobQueue.cleanupCompletedJobs(24);
      expect(removed).toBe(0);

      const retrieved = jobQueue.getJob(job.id);
      expect(retrieved).toBeDefined();
    });

    it('should not remove non-completed jobs', () => {
      const job1 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test1');
      const job2 = jobQueue.addJob('C12345', JobType.ASK_PROMPT, 'test2');

      jobQueue.updateJobStatus(job1.id, JobStatus.RUNNING);

      // Manually set old timestamp
      const oldDate = new Date();
      oldDate.setHours(oldDate.getHours() - 25);
      job1.startedAt = oldDate.toISOString();

      const removed = jobQueue.cleanupCompletedJobs(24);
      expect(removed).toBe(0);

      expect(jobQueue.getJob(job1.id)).toBeDefined();
      expect(jobQueue.getJob(job2.id)).toBeDefined();
    });
  });
});
