/**
 * Universal Player - Support untuk semua source player dan DRM
 * Mendukung: HLS, DASH, MP4, RTMP, WebRTC
 * DRM: Widevine, PlayReady, FairPlay
 */

class UniversalPlayer {
    constructor(config) {
        this.config = {
            container: config.container || 'moko',
            source: config.source,
            type: config.type || 'auto',
            width: config.width || '100%',
            height: config.height || 'calc(100vh - 100px)',
            autoPlay: config.autoPlay || false,
            muted: config.muted || false,
            watermark: config.watermark || null,
            watermarkLink: config.watermarkLink || null,
            ads: config.ads || null,
            drm: config.drm || null,
            preferredPlayer: config.preferredPlayer || 'auto',
            ...config
        };
        
        this.player = null;
        this.playerType = null;
        this.init();
    }

    init() {
        const sourceType = this.detectSourceType();
        const playerEngine = this.selectPlayerEngine(sourceType);
        
        console.log(`Detected source type: ${sourceType}`);
        console.log(`Using player engine: ${playerEngine}`);
        
        this.initPlayer(playerEngine, sourceType);
    }

    detectSourceType() {
        const source = this.config.source.toLowerCase();
        
        if (this.config.type !== 'auto') {
            return this.config.type;
        }
        
        if (source.includes('.m3u8') || source.includes('m3u')) {
            return 'hls';
        } else if (source.includes('.mpd')) {
            return 'dash';
        } else if (source.includes('.mp4') || source.includes('.webm')) {
            return 'mp4';
        } else if (source.startsWith('rtmp://')) {
            return 'rtmp';
        } else if (source.includes('webrtc') || source.includes('.sdp')) {
            return 'webrtc';
        }
        
        return 'hls'; // default
    }

    selectPlayerEngine(sourceType) {
        if (this.config.preferredPlayer !== 'auto') {
            return this.config.preferredPlayer;
        }
        
        // Pilih player engine berdasarkan source type dan DRM
        if (this.config.drm) {
            return 'shaka'; // Shaka Player terbaik untuk DRM
        }
        
        switch(sourceType) {
            case 'dash':
                return 'shaka';
            case 'hls':
                return typeof Clappr !== 'undefined' ? 'clappr' : 'hlsjs';
            case 'rtmp':
                return 'clappr';
            case 'webrtc':
                return 'native';
            default:
                return 'clappr';
        }
    }

    initPlayer(engine, sourceType) {
        this.playerType = engine;
        
        switch(engine) {
            case 'clappr':
                this.initClappr(sourceType);
                break;
            case 'shaka':
                this.initShaka(sourceType);
                break;
            case 'hlsjs':
                this.initHlsJs();
                break;
            case 'videojs':
                this.initVideoJs(sourceType);
                break;
            case 'native':
                this.initNative();
                break;
            default:
                this.initClappr(sourceType);
        }
    }

    initClappr(sourceType) {
        if (typeof Clappr === 'undefined') {
            console.error('Clappr not loaded');
            this.fallbackPlayer(sourceType);
            return;
        }

        const playerConfig = {
            source: this.config.source,
            width: this.config.width,
            height: this.config.height,
            autoPlay: this.config.autoPlay,
            mute: this.config.muted,
            disableErrorScreen: true,
            plugins: [ErrorPlugin],
            playbackNotSupportedMessage: 'Browser tidak mendukung format ini.'
        };

        // Tambahkan mimeType
        if (sourceType === 'hls') {
            playerConfig.mimeType = 'application/x-mpegURL';
        } else if (sourceType === 'dash') {
            playerConfig.mimeType = 'application/dash+xml';
        }

        // Watermark
        if (this.config.watermark) {
            playerConfig.watermark = this.config.watermark;
            playerConfig.watermarkLink = this.config.watermarkLink;
            playerConfig.position = 'bottom-right';
        }

        // Chromecast
        if (typeof ChromecastPlugin !== 'undefined') {
            playerConfig.plugins.push(ChromecastPlugin);
            playerConfig.chromecast = {
                appId: "9DFB77C0",
                contentType: sourceType === 'hls' ? "video/m3u8" : "video/mp4",
                media: {
                    type: ChromecastPlugin.None,
                    title: "IPTV Channel",
                    subtitle: "Streaming"
                }
            };
        }

        // Level Selector
        if (typeof LevelSelector !== 'undefined') {
            playerConfig.plugins.push(LevelSelector);
        }

        // Ads
        if (this.config.ads && typeof ClapprAds !== 'undefined') {
            playerConfig.plugins.push(ClapprAds);
            playerConfig.ads = this.config.ads;
        }

        const container = document.getElementById(this.config.container);
        this.player = new Clappr.Player(playerConfig);
        this.player.attachTo(container);
    }

    initShaka(sourceType) {
        if (typeof shaka === 'undefined') {
            console.error('Shaka Player not loaded');
            this.fallbackPlayer(sourceType);
            return;
        }

        const container = document.getElementById(this.config.container);
        
        // Reuse existing video element if available
        let video = container.querySelector('video');
        let wrapper = container.querySelector('.shaka-wrapper');
        let unmuteBtn = container.querySelector('#unmuteBtn');
        
        if (!video || !wrapper) {
            // Clear container only if needed
            container.innerHTML = '';
            
            // Create simple video element with controls
            video = document.createElement('video');
            video.id = 'shaka-video';
            video.autoplay = this.config.autoPlay;
            video.muted = this.config.muted;
            video.playsInline = true;
            video.controls = true;
            video.preload = 'auto'; // Preload for faster start
            video.style.cssText = 'width: 100%; height: 100%; background: #000;';
            
            // Add wrapper
            wrapper = document.createElement('div');
            wrapper.className = 'shaka-wrapper';
            wrapper.style.cssText = 'position: relative; width: 100%; aspect-ratio: 16/9; background: #000;';
            wrapper.appendChild(video);
            
            // Add custom unmute button
            unmuteBtn = document.createElement('button');
            unmuteBtn.id = 'unmuteBtn';
            unmuteBtn.innerHTML = 'ðŸ”Š Unmute';
            unmuteBtn.style.cssText = `
                position: absolute;
                bottom: 60px;
                right: 15px;
                z-index: 9999;
                background: rgba(0, 0, 0, 0.8);
                color: #fff;
                border: 2px solid #fff;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                border-radius: 6px;
                transition: all 0.3s ease;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            `;
            unmuteBtn.addEventListener('click', () => {
                video.muted = false;
                video.volume = 1;
                unmuteBtn.style.display = 'none';
            });
            wrapper.appendChild(unmuteBtn);
            
            container.appendChild(wrapper);
        }

        // Reuse existing player if available
        if (!this.player) {
            shaka.polyfill.installAll();

            if (!shaka.Player.isBrowserSupported()) {
                console.error('Browser tidak mendukung Shaka Player');
                this.fallbackPlayer(sourceType);
                return;
            }

            console.log('Creating Shaka Player...');
            this.player = new shaka.Player(video);
            console.log('âœ… Shaka Player initialized');
            
            // Error handling - Log only, no auto-reconnect
            this.player.addEventListener('error', (event) => {
                const error = event.detail;
                console.error('Shaka Player Error:', error);
                console.log('ðŸ’¡ Tip: Coba ganti channel atau refresh halaman jika error berlanjut');
            });
            
            // Video event handlers - Log only
            video.addEventListener('stalled', () => {
                console.warn('Video stalled - buffering...');
            });
            
            video.addEventListener('error', (e) => {
                console.error('Video error:', e);
                console.log('ðŸ’¡ Tip: Coba ganti channel atau refresh halaman');
            });
            
            // Log successful playback
            video.addEventListener('playing', () => {
                console.log('â–¶ï¸ Playing');
            });
        }
        
        // Store video reference
        this.videoElement = video;
        
        // MPD Cache for better performance
        if (!this.mpdCache) {
            this.mpdCache = new Map();
        }
        this.currentSource = this.config.source;
        
        // NO AUTO-RECONNECT - User can manually refresh if needed
        // Auto-reconnect causes more flickering than it helps

        // DRM Configuration - Optimized for QUICK FAIL
        const playerConfig = {
            streaming: {
                retryParameters: {
                    timeout: 5000, // Kurangi dari 30s ke 5s untuk quick fail
                    maxAttempts: 2, // Kurangi dari 5 ke 2 attempts
                    baseDelay: 500, // Kurangi delay
                    backoffFactor: 1.5,
                    fuzzFactor: 0.5
                },
                bufferingGoal: 15, // Kurangi buffer untuk faster start
                rebufferingGoal: 5,
                bufferBehind: 30,
                ignoreTextStreamFailures: true,
                alwaysStreamText: false,
                startAtSegmentBoundary: false,
                smallGapLimit: 0.5,
                jumpLargeGaps: true,
                durationBackoff: 1,
                stallEnabled: true,
                stallThreshold: 1,
                stallSkip: 0.1
            },
            manifest: {
                retryParameters: {
                    timeout: 5000, // Kurangi dari 30s ke 5s
                    maxAttempts: 2, // Kurangi dari 5 ke 2
                    baseDelay: 500,
                    backoffFactor: 1.5
                },
                defaultPresentationDelay: 5, // Kurangi dari 10 ke 5
                dash: {
                    clockSyncUri: '',
                    ignoreDrmInfo: false,
                    ignoreMinBufferTime: false
                }
            },
            abr: {
                enabled: true,
                defaultBandwidthEstimate: 1000000,
                switchInterval: 8,
                bandwidthUpgradeTarget: 0.85,
                bandwidthDowngradeTarget: 0.95
            }
        };
        
        if (this.config.drm) {
            console.log('DRM Configuration detected');
            
            // ClearKey - Support multiple formats
            if (this.config.drm.clearkey) {
                const clearkeys = {};
                
                // Format 1: Simple {kid: "xxx", key: "yyy"}
                if (this.config.drm.clearkey.kid && this.config.drm.clearkey.key) {
                    clearkeys[this.config.drm.clearkey.kid] = this.config.drm.clearkey.key;
                    console.log('ClearKey configured');
                }
                // Format 2: Array of keys
                else if (this.config.drm.clearkey.keys) {
                    this.config.drm.clearkey.keys.forEach(k => {
                        if (k.kid && k.k) {
                            clearkeys[k.kid] = k.k;
                        } else if (k.kid && k.key) {
                            clearkeys[k.kid] = k.key;
                        }
                    });
                    console.log('ClearKey configured (array)');
                }
                // Format 3: Direct key-value pairs
                else {
                    Object.assign(clearkeys, this.config.drm.clearkey);
                    console.log('ClearKey configured (direct)');
                }
                
                playerConfig.drm = {
                    clearKeys: clearkeys
                };
                
                console.log('ClearKey keys:', Object.keys(clearkeys).length);
            }
        }
        
        this.player.configure(playerConfig);
        
        // Load source with cache - optimized to prevent flickering + QUICK FAIL
        this.loadShakaSource = async (source, fallback = null) => {
            try {
                this.currentSource = source;
                
                // Cache MPD URL
                if (!this.mpdCache.has(source)) {
                    this.mpdCache.set(source, source);
                }
                
                console.log('Loading:', source.substring(0, 50) + '...');
                
                // Save current time and playing state
                const wasPlaying = this.videoElement && !this.videoElement.paused;
                
                // Unload previous source ONLY if different
                const currentUri = this.player.getAssetUri();
                if (currentUri && currentUri !== source) {
                    // Keep video element visible during transition
                    if (this.videoElement) {
                        this.videoElement.style.opacity = '1';
                    }
                    await this.player.unload(false); // Don't reinitialize
                }
                
                // TIMEOUT PROTECTION - Quick fail jika tidak load dalam 6 detik
                const loadPromise = this.player.load(this.mpdCache.get(source));
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Load timeout - channel tidak merespon')), 6000);
                });
                
                // Race antara load dan timeout
                await Promise.race([loadPromise, timeoutPromise]);
                
                console.log('âœ… Loaded');
                
                // Auto play without flickering
                if (this.videoElement) {
                    // Ensure video is visible
                    this.videoElement.style.opacity = '1';
                    
                    if (wasPlaying || this.config.autoPlay) {
                        this.videoElement.play().catch(e => {
                            console.log('Autoplay prevented');
                        });
                    }
                }
                
            } catch (err) {
                console.error('Load error:', err.message);
                
                // Try fallback if available, but NO auto-reconnect
                if (fallback) {
                    console.log('Trying fallback...');
                    try {
                        // Fallback juga dengan timeout
                        const fallbackPromise = this.player.load(fallback);
                        const fallbackTimeout = new Promise((_, reject) => {
                            setTimeout(() => reject(new Error('Fallback timeout')), 5000);
                        });
                        
                        await Promise.race([fallbackPromise, fallbackTimeout]);
                        console.log('âœ… Fallback loaded');
                    } catch (fallbackErr) {
                        console.error('Fallback failed:', fallbackErr.message);
                        // Throw error agar bisa di-catch di watch-universal.php
                        throw new Error('Channel dan fallback gagal');
                    }
                } else {
                    // Throw error agar bisa di-catch di watch-universal.php
                    throw new Error('Channel tidak dapat dimuat');
                }
            }
        };
        
        // Initial load
        this.loadShakaSource(this.config.source);
    }

    initHlsJs() {
        if (typeof Hls === 'undefined') {
            console.error('HLS.js not loaded');
            this.initNative();
            return;
        }

        const container = document.getElementById(this.config.container);
        const video = document.createElement('video');
        video.id = 'hlsjs-video';
        video.style.width = this.config.width;
        video.style.height = this.config.height;
        video.controls = true;
        video.autoplay = this.config.autoPlay;
        video.muted = this.config.muted;
        container.appendChild(video);

        if (Hls.isSupported()) {
            this.player = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90
            });
            
            this.player.loadSource(this.config.source);
            this.player.attachMedia(video);
            
            this.player.on(Hls.Events.ERROR, (event, data) => {
                console.error('HLS.js Error:', data);
                if (data.fatal) {
                    this.onError(data);
                }
            });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = this.config.source;
        } else {
            console.error('HLS not supported');
            this.onError({message: 'HLS not supported'});
        }
    }

    initVideoJs(sourceType) {
        if (typeof videojs === 'undefined') {
            console.error('Video.js not loaded');
            this.fallbackPlayer(sourceType);
            return;
        }

        const container = document.getElementById(this.config.container);
        const video = document.createElement('video');
        video.id = 'videojs-player';
        video.className = 'video-js vjs-default-skin';
        video.style.width = this.config.width;
        video.style.height = this.config.height;
        video.controls = true;
        container.appendChild(video);

        const sources = [{
            src: this.config.source,
            type: this.getMimeType(sourceType)
        }];

        this.player = videojs('videojs-player', {
            autoplay: this.config.autoPlay,
            muted: this.config.muted,
            sources: sources
        });
    }

    initNative() {
        const container = document.getElementById(this.config.container);
        const video = document.createElement('video');
        video.id = 'native-video';
        video.style.width = this.config.width;
        video.style.height = this.config.height;
        video.controls = true;
        video.autoplay = this.config.autoPlay;
        video.muted = this.config.muted;
        video.src = this.config.source;
        container.appendChild(video);
        
        this.player = video;
        
        video.addEventListener('error', (e) => {
            console.error('Native player error:', e);
            this.onError(e);
        });
    }

    getMimeType(sourceType) {
        const mimeTypes = {
            'hls': 'application/x-mpegURL',
            'dash': 'application/dash+xml',
            'mp4': 'video/mp4',
            'webm': 'video/webm'
        };
        return mimeTypes[sourceType] || 'video/mp4';
    }

    fallbackPlayer(sourceType) {
        console.log('Falling back to native player');
        this.initNative();
    }

    onError(error) {
        console.error('Player Error:', error);
        const container = document.getElementById(this.config.container);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            z-index: 999;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: white;
            text-align: center;
            padding: 20px;
        `;
        
        const errorMessage = error.message || 'Tidak dapat memutar channel ini.';
        const errorDetail = error.detail ? `<p style="font-size: 12px; opacity: 0.6; margin-top: 10px;">Detail: ${error.detail.message || error.detail}</p>` : '';
        
        errorDiv.innerHTML = `
            <h2 style="font-size: 24px; margin-bottom: 20px;">âš ï¸ Channel Error</h2>
            <p style="font-size: 16px; margin-bottom: 10px;">${errorMessage}</p>
            <p style="font-size: 14px; opacity: 0.8;">Coba channel lain atau pilih player engine berbeda.</p>
            ${errorDetail}
            <button onclick="location.reload()" style="
                margin-top: 20px;
                padding: 10px 20px;
                background: #007bff;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 14px;
            ">Reload Page</button>
        `;
        container.appendChild(errorDiv);
    }

    play() {
        if (this.player) {
            if (typeof this.player.play === 'function') {
                this.player.play();
            } else if (this.player.core && typeof this.player.core.play === 'function') {
                this.player.core.play();
            }
        }
    }

    pause() {
        if (this.player) {
            if (typeof this.player.pause === 'function') {
                this.player.pause();
            } else if (this.player.core && typeof this.player.core.pause === 'function') {
                this.player.core.pause();
            }
        }
    }

    changeSource(source, type = 'auto', fallback = null) {
        this.config.source = source;
        this.config.type = type;
        
        // If using Shaka and loadShakaSource exists, use it for seamless switching
        if (this.playerType === 'shaka' && this.loadShakaSource) {
            this.loadShakaSource(source, fallback);
            return;
        }
        
        // Otherwise destroy and reinitialize
        this.destroy();
        this.init();
    }

    destroy() {
        if (this.player) {
            try {
                if (typeof this.player.destroy === 'function') {
                    this.player.destroy();
                } else if (this.player.core && typeof this.player.core.destroy === 'function') {
                    this.player.core.destroy();
                }
            } catch(e) {
                console.error('Error destroying player:', e);
            }
        }
        
        const container = document.getElementById(this.config.container);
        if (container) {
            container.innerHTML = '';
        }
    }
}
