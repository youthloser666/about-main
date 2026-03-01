document.addEventListener("DOMContentLoaded", () => {
    // 1. Audio Player Interaction & Web Audio API Visualizer
    const audio = document.getElementById('custom-audio');
    const playPauseBtn = document.getElementById('play-pause-btn');
    const playPauseIcon = document.getElementById('play-pause-icon');
    const albumCover = document.getElementById('album-cover');
    const progressBar = document.getElementById('progress');
    const currentTimeEl = document.getElementById('current-time');
    const totalTimeEl = document.getElementById('total-time');

    // Canvas Visualizer
    const canvas = document.getElementById('audio-visualizer');

    // Theme Toggle Logic
    const themeBtn = document.getElementById('theme-toggle');
    const themeIcon = themeBtn ? themeBtn.querySelector('i') : null;
    const body = document.body;

    // Check for saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-theme');
        if (themeIcon) {
            themeIcon.classList.replace('ph-moon', 'ph-sun');
        }
    }

    if (themeBtn) {
        themeBtn.addEventListener('click', () => {
            body.classList.toggle('dark-theme');
            const isDark = body.classList.contains('dark-theme');

            // Save preference
            localStorage.setItem('theme', isDark ? 'dark' : 'light');

            // Toggle Icon
            if (themeIcon) {
                if (isDark) {
                    themeIcon.classList.replace('ph-moon', 'ph-sun');
                } else {
                    themeIcon.classList.replace('ph-sun', 'ph-moon');
                }
            }
        });
    }

    // 0. GSAP Pinned Panels with Overscroll (Responsive Mode)
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        // Only apply in responsive mode (e.g., max-width 768px)
        let mm = gsap.matchMedia();

        mm.add("(max-width: 768px)", () => {
            const panels = gsap.utils.toArray('.panel');

            // Pin the first panel (header) so the second panel (bento grid) overscrolls it
            if (panels.length >= 2) {
                ScrollTrigger.create({
                    trigger: panels[0],
                    start: "top top",
                    pin: true,
                    pinSpacing: false // Allows the next element to scroll over it
                });

                // Add parallax fade effect to header as bento grid scrolls up
                gsap.to(panels[0], {
                    opacity: 0,
                    scale: 0.9,
                    y: -30,
                    ease: "none",
                    scrollTrigger: {
                        trigger: panels[1],
                        start: "top 90%", // Start fading when bento grid starts moving up
                        end: "top 10%",   // Fully faded when bento grid covers it
                        scrub: true
                    }
                });
            }
        });
    }

    let audioContext;
    let analyser;
    let dataArray;
    let isPlaying = false;

    function initWebAudio() {
        if (!audioContext && canvas) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = audioContext.createMediaElementSource(audio);
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 64; // Small size for simple bars
            source.connect(analyser);
            analyser.connect(audioContext.destination);

            const bufferLength = analyser.frequencyBinCount;
            dataArray = new Uint8Array(bufferLength);
            const canvasCtx = canvas.getContext('2d');

            function draw() {
                requestAnimationFrame(draw);
                if (!isPlaying) return; // Only draw when playing

                analyser.getByteFrequencyData(dataArray);
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

                const barWidth = 3;
                const gap = 3;
                let x = 0;

                for (let i = 0; i < 15; i++) {
                    // Use a subset of frequency data
                    let dataIndex = Math.floor(i * (bufferLength / 20));
                    let barHeight = (dataArray[dataIndex] / 255) * canvas.height;
                    if (barHeight < 2) barHeight = 2; // Min height

                    canvasCtx.fillStyle = 'rgba(28, 28, 28, 0.6)'; // var(--text-main) with opacity

                    // Draw centered vertically
                    const y = (canvas.height - barHeight) / 2;

                    // Canvas rounded rect draw for visual flair
                    canvasCtx.beginPath();
                    canvasCtx.roundRect(x, y, barWidth, barHeight, 2);
                    canvasCtx.fill();

                    x += barWidth + gap;
                }
            }
            draw();
        }
    }

    if (playPauseBtn && audio) {
        playPauseBtn.addEventListener('click', () => {
            initWebAudio();
            if (audioContext && audioContext.state === 'suspended') {
                audioContext.resume();
            }

            if (audio.paused) {
                audio.play();
                isPlaying = true;
                playPauseIcon.classList.remove('ph-play');
                playPauseIcon.classList.add('ph-pause');
                if (albumCover) albumCover.classList.add('spinning');
            } else {
                audio.pause();
                isPlaying = false;
                playPauseIcon.classList.remove('ph-pause');
                playPauseIcon.classList.add('ph-play');
                if (albumCover) albumCover.classList.remove('spinning');
            }
        });

        audio.addEventListener('timeupdate', () => {
            if (!progressBar) return;
            const progressPercent = (audio.currentTime / audio.duration) * 100;
            progressBar.style.width = `${progressPercent}%`;

            let currentMins = Math.floor(audio.currentTime / 60);
            let currentSecs = Math.floor(audio.currentTime % 60);
            if (currentSecs < 10) currentSecs = `0${currentSecs}`;
            if (!isNaN(currentMins)) currentTimeEl.textContent = `${currentMins}:${currentSecs}`;
        });

        audio.addEventListener('loadedmetadata', () => {
            let totalMins = Math.floor(audio.duration / 60);
            let totalSecs = Math.floor(audio.duration % 60);
            if (totalSecs < 10) totalSecs = `0${totalSecs}`;
            if (!isNaN(totalMins)) totalTimeEl.textContent = `${totalMins}:${totalSecs}`;
        });

        audio.addEventListener('ended', () => {
            isPlaying = false;
            playPauseIcon.classList.remove('ph-pause');
            playPauseIcon.classList.add('ph-play');
            if (albumCover) albumCover.classList.remove('spinning');
            if (progressBar) progressBar.style.width = '0%';
            if (currentTimeEl) currentTimeEl.textContent = '0:00';

            // Clear canvas when ended
            if (canvas) {
                const canvasCtx = canvas.getContext('2d');
                canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
    }

    // 2. Dynamic Music List (Replacement for Reading Card)
    const playlist = [
        { artist: 'Nothing', track: 'Fever Queen' },
        { artist: 'Bring Me The Horizon', track: 'Kingslayer', album: 'POST HUMAN: SURVIVAL HORROR' },
        { artist: 'Turnstile', track: 'HOLIDAY' },
        { artist: 'Title Fight', track: 'Head in the Ceiling Fan' },
        { artist: 'Basement', track: 'Covet' },
        { artist: 'Knocked Loose', track: 'Mistakes Like Fractures' },
        { artist: 'Counterparts', track: 'The Disconnect' },
        { artist: 'Avenged Sevenfold', track: 'A Little Piece OF Heaven' },
        { artist: 'Dustbox', track: 'Morning Glow' }
    ];

    const dynamicTrackEl = document.getElementById('dynamic-track');
    const dynamicArtistEl = document.getElementById('dynamic-artist');
    const nextMusicBtn = document.getElementById('next-music-btn');
    const dynamicCard = document.getElementById('dynamic-music-card');
    let currentMusicIndex = 0;

    async function fetchAlbumCover(song) {
        try {
            // Prioritize album name in search if provided for better accuracy
            const queryStr = song.album ? `${song.artist} ${song.album}` : `${song.artist} ${song.track}`;
            const query = encodeURIComponent(queryStr);
            // Use iTunes Search API to get album covers
            const response = await fetch(`https://itunes.apple.com/search?term=${query}&entity=song&limit=1`);
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                // Return high-res cover
                return data.results[0].artworkUrl100.replace('100x100bb', '600x600bb');
            }
        } catch (e) {
            console.error("Failed to fetch cover", e);
        }
        // Fallback placeholder
        return `https://placehold.co/600x600/1E1E1E/FFFFFF?text=${encodeURIComponent(song.artist)}`;
    }

    function updatePlaylistUI(index) {
        const currentSong = playlist[index];

        if (dynamicTrackEl) dynamicTrackEl.style.opacity = 0;
        if (dynamicArtistEl) dynamicArtistEl.style.opacity = 0;

        fetchAlbumCover(currentSong).then(coverUrl => {
            if (dynamicCard) {
                dynamicCard.style.backgroundImage = `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.7)), url('${coverUrl}')`;
                dynamicCard.style.backgroundSize = 'cover';
                dynamicCard.style.backgroundPosition = 'center';
            }

            setTimeout(() => {
                if (dynamicTrackEl) {
                    dynamicTrackEl.textContent = currentSong.track;
                    dynamicTrackEl.style.opacity = 1;
                }
                if (dynamicArtistEl) {
                    dynamicArtistEl.textContent = currentSong.artist;
                    dynamicArtistEl.style.opacity = 1;
                }
            }, 200);
        });
    }

    if (nextMusicBtn) {
        nextMusicBtn.addEventListener('click', () => {
            currentMusicIndex = (currentMusicIndex + 1) % playlist.length;
            updatePlaylistUI(currentMusicIndex);
        });
    }

    if (dynamicTrackEl) {
        dynamicTrackEl.style.transition = 'opacity 0.2s';
        dynamicArtistEl.style.transition = 'opacity 0.2s';
    }

    // Initialize first cover
    updatePlaylistUI(0);

    // 3. Contact Me Tab Switching
    // Updated selector since we moved to top-right icons
    const contactTabsNav = document.querySelectorAll('.contact-icon-tab');
    const contactTabs = document.querySelectorAll('.contact-tab');

    if (contactTabsNav.length > 0) {
        contactTabsNav.forEach(navBtn => {
            navBtn.addEventListener('click', () => {
                const targetId = navBtn.getAttribute('data-target');

                // Remove active class from all nav buttons
                contactTabsNav.forEach(btn => btn.classList.remove('active'));
                navBtn.classList.add('active');

                // Hide all tabs
                contactTabs.forEach(tab => {
                    tab.style.display = 'none';
                    tab.classList.remove('active');
                });

                // Show target tab
                const targetTab = document.getElementById(targetId);
                if (targetTab) {
                    targetTab.style.display = 'block';
                    // small delay for potential fade effect
                    setTimeout(() => targetTab.classList.add('active'), 10);
                }
            });
        });
    }

    // 4. Cycling Slideshow Loop
    const slideshowContainer = document.getElementById('cycling-slideshow');
    if (slideshowContainer) {
        let imageIndex = 0;
        const slides = [];
        const extensions = ['jpeg', 'jpg', 'png'];

        function loadSlide(num) {
            let extIndex = 0;

            function tryNextExtension() {
                if (extIndex >= extensions.length) {
                    return; // Stop loading when no more extensions match this number
                }

                const img = new Image();
                img.onload = () => {
                    img.alt = `Cycling ${num}`;
                    img.className = 'slide bw-grunge';

                    slideshowContainer.insertBefore(img, slideshowContainer.querySelector('.grunge-overlay'));
                    slides.push(img);

                    if (slides.length === 1) {
                        img.classList.add('active');
                        // Remove initial placeholder if it exists
                        const placeholder = slideshowContainer.querySelector('.temp-placeholder');
                        if (placeholder) placeholder.remove();
                    }

                    // Successfully loaded this number, proceed to next
                    loadSlide(num + 1);
                };

                img.onerror = () => {
                    extIndex++;
                    tryNextExtension();
                };

                img.src = `img/${num}.${extensions[extIndex]}`;
            }

            tryNextExtension();
        }

        // Start loading from image 1
        loadSlide(1);

        setInterval(() => {
            if (slides.length > 1) {
                slides[imageIndex].classList.remove('active');
                imageIndex = (imageIndex + 1) % slides.length;
                slides[imageIndex].classList.add('active');
            }
        }, 4000); // 4 seconds interval
    }

    // 5. Entrance Animation (Continuous Scroll Playback)
    const cards = document.querySelectorAll('.bento-card, .main-header');

    // Observer setup for continuous triggering
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            } else {
                // Reset styles when scrolling out of view indefinitely
                entry.target.style.transition = 'none'; // Instant reset
                entry.target.style.opacity = '0';
                entry.target.style.transform = 'translateY(20px)';
            }
        });
    }, observerOptions);

    // Initial hidden state and observe
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        observer.observe(card);
    });
});
