export function throttle(fn: () => Promise<unknown>, delay: number): () => Promise<void> {
  let isRunning = false;
  let hasPendingCall = false;

  return async () => {
    hasPendingCall = true;

    if (isRunning) {
      return;
    }

    try {
      isRunning = true;
      while (hasPendingCall) {
        hasPendingCall = false;
        await new Promise((resolve) => setTimeout(resolve, delay));
        await fn();
      }
    } finally {
      isRunning = false;
    }
  };
}
