/* =========================================================
   StoreFront — pre-boot
   Runs blocking in <head> before first paint. Setting the
   `js` class this early means scroll-reveal only hides
   content when JS is able to reveal it again. Kept external
   so the Content-Security-Policy can require script-src 'self'
   with no inline exceptions.
   ========================================================= */
document.documentElement.classList.add('js');
