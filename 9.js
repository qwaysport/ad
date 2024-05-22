if (Hls.isSupported()) {
  var video = document.getElementById('video');
  var hls = new Hls();
  
  // Array of video sources
  var videoSources = [
    'https://tonton-live-ssai.akamaized.net/live/2020783a-0303-401a-9c92-b7c3c9108c0b/cmaf.isml/.m3u8',
    'https://tonton-live-ssai.akamaized.net/live/2dd2b7cd-1b34-4871-b669-57b5c9beca23/cmaf.isml/.m3u8',
    'https://tonton-live-ssai.akamaized.net/live/2dd2b7cd-1b34-4871-b669-57b5c9beca23/cmaf.isml/.m3u8'
  ];
  
  // Function to try the next source on error
  function tryNextSource(index) {
    if (index < videoSources.length - 1) {
      hls.loadSource(videoSources[index + 1]);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, function() {
        video.play();
      });
    } else {
      console.error('All video sources failed.');
    }
  }

  // Try the first source
  hls.loadSource(videoSources[0]);
  hls.attachMedia(video);

  // Event listeners for error handling
  hls.on(Hls.Events.ERROR, function(event, data) {
    if (data.fatal) {
      switch (data.type) {
        case Hls.ErrorTypes.NETWORK_ERROR:
          // Try the next source on network error
          tryNextSource(0);
          break;
        case Hls.ErrorTypes.MEDIA_ERROR:
          // Try the next source on media error
          tryNextSource(0);
          break;
        default:
          // No other recovery options, log the error
          console.error('Unrecoverable error:', data);
          break;
      }
    }
  });
}
