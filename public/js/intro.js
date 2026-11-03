// The brand intro video (3D logo, 8 s), played full screen on phones once when the
// app is opened -- not again on reloads in the same tab/session. Tap to
// skip. Starts muted where the browser blocks sound (almost always on a
// fresh open), and gets out of the way if the video can't play (iOS Low
// Power Mode blocks autoplay) or is slow to load. Plain script so it shows
// before the React app has loaded.
(function () {
  // phones only, not the website on a computer (or a tablet). The preview
  // page's phone frames ask for it with ?platform=ios|android.
  var forced = new URLSearchParams(location.search).get("platform");
  var phone = forced ? forced === "ios" || forced === "android" : /iPhone|iPod|Android.*Mobile/i.test(navigator.userAgent);
  if (!phone) return;
  try {
    if (sessionStorage.getItem("shadi.intro")) return;
    sessionStorage.setItem("shadi.intro", "1");
  } catch (e) { /* private mode: just play it */ }
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  var o = document.createElement("div");
  o.id = "shadiIntro";
  o.innerHTML =
    "<style>" +
    "#shadiIntro{position:fixed;inset:0;z-index:999999;background:#030303;transition:opacity .5s ease;cursor:pointer}" +
    "#shadiIntro video{width:100%;height:100%;object-fit:cover;display:block}" +
    "@media (min-aspect-ratio:3/4){#shadiIntro video{object-fit:contain}}" +
    "#shadiIntro span{position:absolute;bottom:calc(22px + env(safe-area-inset-bottom,0px));inset-inline-end:20px;font:600 12px Cairo,sans-serif;color:rgba(255,255,255,.45);letter-spacing:.02em}" +
    "</style>" +
    '<video src="intro.mp4" playsinline webkit-playsinline preload="auto"></video><span>اضغط للتخطي</span>';
  document.body.insertBefore(o, document.body.firstChild);

  var v = o.querySelector("video");
  var gone = false;
  function done() {
    if (gone) return;
    gone = true;
    o.style.opacity = "0";
    setTimeout(function () { o.remove(); }, 520);
  }
  o.addEventListener("click", done);
  v.addEventListener("ended", done);
  v.addEventListener("error", done);
  setTimeout(done, 11000); // never stuck on screen
  // slow connection: don't hold the app hostage waiting for the video
  setTimeout(function () { if (v.currentTime === 0) done(); }, 3000);

  var p = v.play();
  if (p && p.catch) {
    p.catch(function () {
      v.muted = true;
      var q = v.play();
      if (q && q.catch) q.catch(done);
    });
  }
})();
