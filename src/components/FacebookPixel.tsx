// Meta Pixel is now initialized inline in index.html with a deferred fbevents.js loader,
// so the heavy 99KB script never hits the LCP path. This file is intentionally a no-op
// kept around in case any other code still imports it.
declare global {
  interface Window {
    fbq: any;
    _fbq: any;
  }
}

const FacebookPixel = () => null;
export default FacebookPixel;
