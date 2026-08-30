export type JobType =
  | 'DISCOVER_RELEASES'
  | 'ENRICH_MOVIE'
  | 'REFRESH_MOVIE'
  | 'NORMALIZE_MOVIE'
  | 'VALIDATE_MOVIE'
  | 'DEDUP_MOVIES'
  | 'PREPARE_DAILY_PUZZLES'
  | 'REBUILD_SEARCH_INDEX';

export interface Job<T = unknown> {
  id: string;
  type: JobType;
  data: T;
  attempts: number;
  maxAttempts: number;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

class QueueService {
  private handlers = new Map<JobType, JobHandler>();
  private jobs: Job[] = [];
  private isProcessing = false;

  registerHandler<T>(type: JobType, handler: JobHandler<T>) {
    this.handlers.set(type, handler as JobHandler);
  }

  async enqueue<T>(type: JobType, data: T, maxAttempts = 3): Promise<Job<T>> {
    const job: Job<T> = {
      id: `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      data,
      attempts: 0,
      maxAttempts,
      status: 'QUEUED',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.jobs.push(job as Job);
    // Trigger async processing non-blocking
    setTimeout(() => this.processNext(), 10);
    return job;
  }

  getJobs(limit = 50): Job[] {
    return [...this.jobs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, limit);
  }

  getQueueStats() {
    const queued = this.jobs.filter((j) => j.status === 'QUEUED').length;
    const running = this.jobs.filter((j) => j.status === 'RUNNING').length;
    const completed = this.jobs.filter((j) => j.status === 'COMPLETED').length;
    const failed = this.jobs.filter((j) => j.status === 'FAILED').length;
    return { queued, running, completed, failed, total: this.jobs.length };
  }

  async retryJob(jobId: string): Promise<boolean> {
    const job = this.jobs.find((j) => j.id === jobId);
    if (!job || job.status !== 'FAILED') return false;
    job.status = 'QUEUED';
    job.error = undefined;
    job.updatedAt = new Date();
    setTimeout(() => this.processNext(), 10);
    return true;
  }

  private async processNext() {
    if (this.isProcessing) return;
    const pendingJob = this.jobs.find((j) => j.status === 'QUEUED');
    if (!pendingJob) return;

    this.isProcessing = true;
    pendingJob.status = 'RUNNING';
    pendingJob.attempts += 1;
    pendingJob.updatedAt = new Date();

    const handler = this.handlers.get(pendingJob.type);
    if (!handler) {
      pendingJob.status = 'FAILED';
      pendingJob.error = `No handler registered for job type: ${pendingJob.type}`;
      pendingJob.updatedAt = new Date();
      this.isProcessing = false;
      this.processNext();
      return;
    }

    try {
      await handler(pendingJob);
      pendingJob.status = 'COMPLETED';
      pendingJob.updatedAt = new Date();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      pendingJob.error = errorMsg;
      if (pendingJob.attempts >= pendingJob.maxAttempts) {
        pendingJob.status = 'FAILED';
      } else {
        pendingJob.status = 'QUEUED'; // Will retry
      }
      pendingJob.updatedAt = new Date();
    } finally {
      this.isProcessing = false;
      setTimeout(() => this.processNext(), 20);
    }
  }
}

export const queueService = new QueueService();
