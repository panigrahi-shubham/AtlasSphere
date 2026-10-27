/** Cancel obsolete requests and keep timeout errors separate from cancellation. */
export async function fetchJSON(url, { signal, timeoutMs = 15000, service = 'Location', action = 'Search' } = {}) {
  const controller = new AbortController();
  let timedOut = false;
  const cancel = () => controller.abort();
  signal?.addEventListener('abort', cancel, { once: true });
  if (signal?.aborted) cancel();
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(response.status === 429
        ? `${action === 'Search' ? 'Too many searches' : 'Too many weather requests'}. Please wait a moment and try again.`
        : `${service} service unavailable (${response.status}). Please try again.`);
    }
    try { return await response.json(); }
    catch (error) {
      if (controller.signal.aborted) throw error;
      throw new Error(`The ${service.toLowerCase()} service returned unreadable data. Please try again.`);
    }
  } catch (error) {
    if (timedOut) throw new Error(`${action} timed out. Please try again.`);
    if (signal?.aborted) throw new DOMException(`${action} cancelled`, 'AbortError');
    if (error instanceof TypeError) throw new Error('Unable to connect. Check your internet connection and try again.');
    throw error;
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener('abort', cancel);
  }
}
