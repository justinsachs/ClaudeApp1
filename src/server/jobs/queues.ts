import Bull from 'bull';

// Job queues for background processing
export const videoQueue = new Bull('video-generation', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 100
  }
});

export const notebookQueue = new Bull('notebook-processing', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    }
  }
});

export const contentQueue = new Bull('content-extraction', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379')
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 1000
    }
  }
});

// Setup event handlers
videoQueue.on('completed', (job, result) => {
  console.log(`Video job ${job.id} completed:`, result);
});

videoQueue.on('failed', (job, err) => {
  console.error(`Video job ${job?.id} failed:`, err.message);
});

contentQueue.on('completed', (job, result) => {
  console.log(`Content extraction job ${job.id} completed:`, result);
});

contentQueue.on('failed', (job, err) => {
  console.error(`Content extraction job ${job?.id} failed:`, err.message);
});

notebookQueue.on('completed', (job, result) => {
  console.log(`Notebook job ${job.id} completed:`, result);
});

notebookQueue.on('failed', (job, err) => {
  console.error(`Notebook job ${job?.id} failed:`, err.message);
});
