        async function initPlayer(source, fallback) {
            const video = document.getElementById('video');
            const ui = video['ui'];
            const controls = ui.getControls();
            const player = controls.getPlayer();

            // Configure ClearKey DRM
            player.configure({
                drm: {
                    clearKeys: {
                        'ead0335d60401225727a6d531e9c2710': '1ee3b252227c5c2ec9378c833d2e14ff',
                        '1ece3ecb41699e855c6dc9a283908210': 'ba08be767e1a5e89777e68a6998a8c19'
                      
                    }
                }
            });

            player.addEventListener('error', (errorEvent) => {
                console.error('Player error:', errorEvent.detail);
                if (fallback) {
                    console.log('Loading fallback source...');
                    player.load(fallback).catch(console.error);
                }
            });

            try {
                console.log('Loading source:', source);
                await player.load(source);
                console.log('The video has now been loaded!');
            } catch (error) {
                console.error('Error while loading source:', error);
                if (fallback) {
                    console.log('Loading fallback source...');
                    await player.load(fallback).catch(console.error);
                }
            }
        }

        // Initialize with default source
        document.addEventListener('shaka-ui-loaded', () => {
            const defaultSource = 'https://d25tgymtnqzu8s.cloudfront.net/smil:tv1/manifest.mpd';
            const fallbackSource = 'https://d25tgymtnqzu8s.cloudfront.net/smil:tv1/manifest.mpd';
            initPlayer(defaultSource, fallbackSource);
        });

        // Button Click Handlers
        document.querySelectorAll('.nav1-link').forEach((button) => {
            button.addEventListener('click', () => {
                const source = button.getAttribute('data-value');
                const fallback = button.getAttribute('data-fallback');

                // Reset Active Button
                document.querySelectorAll('.nav1-link').forEach((btn) => btn.classList.remove('active'));
                button.classList.add('active');

                // Load new source
                initPlayer(source, fallback);
            });
        });

        document.addEventListener('shaka-ui-load-failed', () => {
            console.error('Unable to load the Shaka Player UI library!');
        });
