/**
 * local server entry file, for local development and production
 */
import app from './app.js';

process.on('uncaughtException', (err: Error) => {
  console.error('[FATAL] uncaughtException (NO matamos el proceso):', err.message);
  console.error(err.stack);
});

process.on('unhandledRejection', (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.error('[FATAL] unhandledRejection (NO matamos el proceso):', msg);
  if (reason instanceof Error && reason.stack) {
    console.error(reason.stack);
  }
});

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
