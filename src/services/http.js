/** Cancel obsolete requests and keep timeout errors separate from cancellation. */
export async function fetchJSON(url, { signal, timeoutMs = 15000, service = 'Location', action = 'Search', fallbackUrl, fallbackOnSlow = false } = {}) {
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
    let response, usedFallback = false;
    if (fallbackUrl && fallbackOnSlow) {
      const primary = new AbortController();
      let slow = false;
      const cancelPrimary = () => primary.abort();
      controller.signal.addEventListener('abort', cancelPrimary, { once: true });
      if (controller.signal.aborted) cancelPrimary();
      const slowTimer = setTimeout(() => { slow = true; primary.abort(); }, 3500);
      try {
        response = await fetch(url, { signal: primary.signal });
      } catch (error) {
        if (!slow || controller.signal.aborted) throw error;
        usedFallback = true; response = await fetch(fallbackUrl, { signal: controller.signal });
      } finally {
        clearTimeout(slowTimer);
        controller.signal.removeEventListener('abort', cancelPrimary);
      }
    } else response = await fetch(url, { signal: controller.signal });
    if (fallbackUrl && !usedFallback && response.status === 503 && response.headers?.has('Retry-After')) {
      response = await fetch(fallbackUrl, { signal: controller.signal });
    }
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
