export function notFound(_req, res) {
  res.status(404).json({ detail: 'Not found' });
}

export function errorHandler(err, _req, res, _next) {
  console.error('[ERROR]', err);
  const status = err.status || 500;
  res.status(status).json({
    detail: err.message || 'Internal server error',
  });
}
