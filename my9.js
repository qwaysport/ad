    const 
      manifestUri = 'https://tonton-live-ssai.akamaized.net/live/2020783a-0303-401a-9c92-b7c3c9108c0b/cmaf.isml/.m3u8',
    channel = '';

    const
      vid = document.getElementById("video"),
     ch = document.getElementById("title");
    cs = document.getElementById("live");

    $(vid).ready(function() {
      var completeloaded = false;
      var vids = $("video");
      vids.on("canplaythrough", function() {
        $(ch).html(channel);
        $(cs).html("");
        setTimeout(function() {
          $(vid).trigger("play");
        }, 2500);
        completeloaded = true;
      });

      $(vid).attr({
        "autoplay": "true",
        "preload": "auto",
        "playsinline": "true",
        "poster": "",
        "controlsList": "nodownload noremoteplayback"
      });
    });

    function initApp() {
      shaka.polyfill.installAll();
      if (shaka.Player.isBrowserSupported()) {
        init();
      } else {
        console.error('Browser not supported!');
      }
    }

    async function init() {
      const video = document.getElementById('video');
      const ui = video['ui'];
      const controls = ui.getControls();
      const player = controls.getPlayer();
      const config = {
        'seekBarColors': {
          base: 'rgba(66, 133, 244, 0.35)',
          buffered: 'rgba(66, 133, 244, 0.6)',
          played: 'rgba(66, 133, 244, 0.8)',
        },
        'volumeBarColors': {
          base: 'rgba(66, 133, 244, 0.8)',
          level: 'rgb(66, 133, 244)',
        }
      }
      ui.configure(config);

      window.player = player;
      window.ui = ui;
      window.controls = controls;

      player.addEventListener("error", onPlayerErrorEvent);
      controls.addEventListener("error", onUIErrorEvent);

      try {
        await player.load(manifestUri);
        console.log('The video has now been loaded!');
      } catch (error) {
        onPlayerError(error);
      }

      player.configure({
        drm: {
          clearKeys: {
            '27828727f0a3a0b4fbc668378ccf8c10': '958e9cb7389e20948de5a542d2729ecf'
          }
        }
      });

      function onPlayerErrorEvent(errorEvent) {
        onPlayerError(event.detail);
      }

      function onPlayerError(error) {
        console.error('Error code', error.code + ':', 'Video could not be loaded!', '[Media not found].');
      }

      function onUIErrorEvent(errorEvent) {
        onPlayerError(event.detail);
      }
    }

    function initFailed(errorEvent) {
      console.error('Unable to load the UI library!');
    }

    document.addEventListener('shaka-ui-loaded', init);
    document.addEventListener('shaka-ui-load-failed', initFailed);
    document.addEventListener('DOMContentLoaded', initApp);

    Object.defineProperty(navigator, 'userAgent', {
      get: function() { // Latest update.
        return 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.0.0 Firefox/112.0 Safari/605.1.15 Edg/112.0.1722.48 OPR/97.0.4719.17 Vivaldi/5.7.2921.68 YaBrowser/23.3.0 Yowser/2.5';
      }

      /** ShakaPlayer
       * Does not support browsers.
       * Internet Explorer (IE11) / Trident/7.0; rv:11.0
       */
    });
