/* ============================================================
   PWA Play — app.js
   Music player logic: file picker, playlist, playback controls
   ============================================================ */

(function () {
  'use strict';

  /* ----------------------------------------------------------
     STATE
  ---------------------------------------------------------- */
  let songs = [];          // { file, name, url, duration }
  let currentIndex = -1;
  let isPlaying = false;

  /* ----------------------------------------------------------
     DOM REFERENCES
  ---------------------------------------------------------- */
  const audio         = document.getElementById('audio-player');
  const fileInput     = document.getElementById('file-input');
  const songList      = document.getElementById('song-list');
  const songCount     = document.getElementById('song-count');
  const emptyState    = document.getElementById('empty-state');
  const emptyAddBtn   = document.getElementById('empty-add-btn');
  const addSongsBtn   = document.getElementById('add-songs-btn');

  // Now-playing card
  const npTitle       = document.getElementById('np-title');
  const npArtist      = document.getElementById('np-artist');
  const miniArt       = document.getElementById('mini-art');
  const pulseIndicator= document.getElementById('pulse-indicator');
  const miniPlayBtn   = document.getElementById('mini-play-btn');

  // Bottom player
  const progressBar   = document.getElementById('progress-bar');
  const progressFill  = document.getElementById('progress-fill');
  const timeCurrent   = document.getElementById('time-current');
  const timeTotal     = document.getElementById('time-total');
  const btnPlayPause  = document.getElementById('btn-play-pause');
  const btnPrev       = document.getElementById('btn-prev');
  const btnNext       = document.getElementById('btn-next');
  const iconPlay      = document.getElementById('icon-play');
  const iconPause     = document.getElementById('icon-pause');

  /* ----------------------------------------------------------
     COLOR PALETTE for song thumbnails
  ---------------------------------------------------------- */
  const THUMB_COLORS = [
    'violet', 'cyan', 'rose', 'amber',
    'emerald', 'indigo', 'fuchsia', 'red'
  ];

  /* ----------------------------------------------------------
     HELPERS
  ---------------------------------------------------------- */
  function formatTime(sec) {
    if (!sec || isNaN(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function cleanFileName(name) {
    // Remove extension and replace underscores/dashes with spaces
    return name
      .replace(/\.[^.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .trim();
  }

  function thumbColor(index) {
    return THUMB_COLORS[index % THUMB_COLORS.length];
  }

  function musicNoteSVG() {
    return `<svg fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
    </svg>`;
  }

  /* ----------------------------------------------------------
     FILE INPUT HANDLING
  ---------------------------------------------------------- */
  function openFilePicker() {
    fileInput.click();
  }

  fileInput.addEventListener('change', function (e) {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    addSongs(files);
    // Reset so the same files can be re-selected
    fileInput.value = '';
  });

  function addSongs(files) {
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));

    audioFiles.forEach(file => {
      const url = URL.createObjectURL(file);
      songs.push({
        file: file,
        name: cleanFileName(file.name),
        url: url,
        duration: null
      });
    });

    // Probe durations
    songs.forEach((song, i) => {
      if (song.duration !== null) return;
      const tmp = new Audio();
      tmp.addEventListener('loadedmetadata', () => {
        songs[i].duration = tmp.duration;
        renderSongList();
        // Update now-playing if this is the active song
        if (currentIndex === i) {
          timeTotal.textContent = formatTime(tmp.duration);
        }
      });
      tmp.src = song.url;
    });

    renderSongList();

    // Auto-play the first song if nothing is selected
    if (currentIndex === -1 && songs.length > 0) {
      loadSong(0);
    }
  }

  /* ----------------------------------------------------------
     RENDER SONG LIST
  ---------------------------------------------------------- */
  function renderSongList() {
    // Update count
    songCount.textContent = songs.length + ' canción' + (songs.length !== 1 ? 'es' : '');

    // Toggle empty state
    if (songs.length === 0) {
      emptyState.classList.remove('hidden');
      songList.innerHTML = '';
      return;
    }

    emptyState.classList.add('hidden');

    songList.innerHTML = songs.map((song, i) => {
      const active = i === currentIndex ? ' active' : '';
      const playing = i === currentIndex && isPlaying;
      const color = thumbColor(i);

      return `
        <div class="song-item${active}" data-index="${i}">
          <div class="song-thumb ${color}">
            ${musicNoteSVG()}
          </div>
          <div class="song-details">
            <p class="song-name${active ? ' song-name-bold' : ''}">${song.name}</p>
            <p class="song-meta">${song.duration ? formatTime(song.duration) : '...'}</p>
          </div>
          ${playing ? `
            <div class="equalizer">
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
              <div class="eq-bar"></div>
            </div>
          ` : ''}
        </div>`;
    }).join('');

    // Attach click listeners
    songList.querySelectorAll('.song-item').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.index, 10);
        loadSong(idx);
        play();
      });
    });
  }

  /* ----------------------------------------------------------
     PLAYBACK
  ---------------------------------------------------------- */
  function loadSong(index) {
    if (index < 0 || index >= songs.length) return;
    currentIndex = index;
    const song = songs[index];

    audio.src = song.url;
    audio.load();

    // Update now-playing card
    npTitle.textContent = song.name;
    npArtist.textContent = song.file.type || 'Audio';
    miniArt.classList.add('playing');
    pulseIndicator.style.display = 'flex';

    timeTotal.textContent = song.duration ? formatTime(song.duration) : '0:00';
    timeCurrent.textContent = '0:00';
    progressBar.value = 0;
    progressFill.style.width = '0%';

    renderSongList();
  }

  function play() {
    if (currentIndex === -1 || songs.length === 0) return;
    audio.play().then(() => {
      isPlaying = true;
      updatePlayPauseIcons();
      miniArt.classList.add('playing');
      renderSongList();
    }).catch(() => { /* autoplay blocked */ });
  }

  function pause() {
    audio.pause();
    isPlaying = false;
    updatePlayPauseIcons();
    miniArt.classList.remove('playing');
    renderSongList();
  }

  function togglePlayPause() {
    if (currentIndex === -1) {
      if (songs.length > 0) {
        loadSong(0);
        play();
      }
      return;
    }
    isPlaying ? pause() : play();
  }

  function playNext() {
    if (songs.length === 0) return;
    const next = (currentIndex + 1) % songs.length;
    loadSong(next);
    play();
  }

  function playPrev() {
    if (songs.length === 0) return;
    // If more than 3 seconds in, restart current song
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const prev = (currentIndex - 1 + songs.length) % songs.length;
    loadSong(prev);
    play();
  }

  function updatePlayPauseIcons() {
    if (isPlaying) {
      iconPlay.style.display = 'none';
      iconPause.style.display = 'block';
    } else {
      iconPlay.style.display = 'block';
      iconPause.style.display = 'none';
    }
  }

  /* ----------------------------------------------------------
     PROGRESS BAR
  ---------------------------------------------------------- */
  audio.addEventListener('timeupdate', () => {
    if (!audio.duration) return;
    const pct = (audio.currentTime / audio.duration) * 100;
    progressBar.value = pct;
    progressFill.style.width = pct + '%';
    timeCurrent.textContent = formatTime(audio.currentTime);
  });

  audio.addEventListener('loadedmetadata', () => {
    timeTotal.textContent = formatTime(audio.duration);
    // Update song duration in our array
    if (currentIndex >= 0 && songs[currentIndex]) {
      songs[currentIndex].duration = audio.duration;
    }
  });

  audio.addEventListener('ended', () => {
    playNext();
  });

  // Seek on user interaction
  progressBar.addEventListener('input', () => {
    if (!audio.duration) return;
    const pct = progressBar.value;
    audio.currentTime = (pct / 100) * audio.duration;
    progressFill.style.width = pct + '%';
  });

  /* ----------------------------------------------------------
     EVENT LISTENERS
  ---------------------------------------------------------- */
  addSongsBtn.addEventListener('click', openFilePicker);
  emptyAddBtn.addEventListener('click', openFilePicker);
  btnPlayPause.addEventListener('click', togglePlayPause);
  miniPlayBtn.addEventListener('click', togglePlayPause);
  btnNext.addEventListener('click', playNext);
  btnPrev.addEventListener('click', playPrev);

  /* ----------------------------------------------------------
     SERVICE WORKER REGISTRATION
  ---------------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

})();
