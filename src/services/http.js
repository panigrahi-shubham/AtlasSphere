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
      const error = new Error(response.status === 429
        ? `${action === 'Search' ? 'Too many searches' : 'Too many weather requests'}. Please wait a moment and try again.`
        : `${service} service unavailable (${response.status}). Please try again.`);
      error.status = response.status;
      throw error;
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

/** Retry one provider request only after a known transient HTTP failure. */
export async function fetchJSONWithFallback(primaryUrl, fallbackUrl, options = {}) {
  try { return await fetchJSON(primaryUrl, options); }
  catch (original) {
    if (options.signal?.aborted || ![502, 503, 504].includes(original?.status)) throw original;
    try { return await fetchJSON(fallbackUrl, options); }
    catch { throw original; }
  }
}
