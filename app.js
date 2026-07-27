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
  let deferredPrompt = null;

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

  // Install PWA
  const installBtn    = document.getElementById('install-btn');

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
     INDEXEDDB — Persistent storage for songs
  ---------------------------------------------------------- */
  const DB_NAME = 'pwa-play-db';
  const DB_VERSION = 1;
  const STORE_NAME = 'songs';

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async function idbSaveSong(song) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(song);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IDB save failed:', err);
    }
  }

  async function idbGetAllSongs() {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const request = tx.objectStore(STORE_NAME).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IDB read failed:', err);
      return [];
    }
  }

  async function idbDeleteSong(id) {
    try {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (err) {
      console.warn('IDB delete failed:', err);
    }
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

  async function addSongs(files) {
    const audioFiles = files.filter(f => f.type.startsWith('audio/'));

    for (const file of audioFiles) {
      const url = URL.createObjectURL(file);
      const id = 'song_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
      songs.push({
        id: id,
        file: file,
        name: cleanFileName(file.name),
        url: url,
        duration: null
      });

      // Persist to IndexedDB
      try {
        const buffer = await file.arrayBuffer();
        await idbSaveSong({
          id: id,
          name: file.name,
          type: file.type,
          data: buffer
        });
      } catch (err) {
        console.warn('Could not save song to IDB:', file.name, err);
      }
    }

    // Probe durations
    songs.forEach((song, i) => {
      if (song.duration !== null) return;
      const tmp = new Audio();
      tmp.addEventListener('loadedmetadata', () => {
        songs[i].duration = tmp.duration;
        renderSongList();
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
          <button class="song-delete-btn btn-press" data-delete-index="${i}" title="Eliminar">
            <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="16" height="16">
              <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
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
      el.addEventListener('click', (e) => {
        // Don't load song if delete button was clicked
        if (e.target.closest('.song-delete-btn')) return;
        const idx = parseInt(el.dataset.index, 10);
        loadSong(idx);
        play();
      });
    });

    // Attach delete listeners
    songList.querySelectorAll('.song-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.deleteIndex, 10);
        removeSong(idx);
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
     RESTORE SONGS FROM IndexedDB
  ---------------------------------------------------------- */
  async function restoreSongs() {
    const stored = await idbGetAllSongs();
    if (!stored || stored.length === 0) return;

    stored.forEach(song => {
      const blob = new Blob([song.data], { type: song.type });
      const ext = song.name.split('.').pop() || 'mp3';
      const file = new File([blob], song.name, { type: song.type });
      const url = URL.createObjectURL(file);
      songs.push({
        id: song.id,
        file: file,
        name: cleanFileName(song.name),
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
        if (currentIndex === i) {
          timeTotal.textContent = formatTime(tmp.duration);
        }
      });
      tmp.src = song.url;
    });

    renderSongList();
  }

  /* ----------------------------------------------------------
     REMOVE SONG (from array + IndexedDB)
  ---------------------------------------------------------- */
  async function removeSong(index) {
    if (index < 0 || index >= songs.length) return;

    const song = songs[index];

    // Revoke blob URL to free memory
    if (song.url) URL.revokeObjectURL(song.url);

    // Remove from array
    songs.splice(index, 1);

    // Adjust currentIndex
    if (songs.length === 0) {
      currentIndex = -1;
      isPlaying = false;
      audio.src = '';
      npTitle.textContent = 'Selecciona una canción';
      npArtist.textContent = '—';
      miniArt.classList.remove('playing');
      pulseIndicator.style.display = 'none';
      updatePlayPauseIcons();
    } else if (index === currentIndex) {
      // Was playing, pick a neighbor
      const nextIdx = index >= songs.length ? songs.length - 1 : index;
      loadSong(nextIdx);
      play();
    } else if (index < currentIndex) {
      currentIndex--;
    }

    // Delete from IndexedDB
    if (song.id) {
      await idbDeleteSong(song.id);
    }

    renderSongList();
  }

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
      INSTALL PWA
   ---------------------------------------------------------- */
  const installBtnText = document.getElementById('install-btn-text');

  function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  }

  function updateInstallButton() {
    if (isStandalone()) {
      installBtnText.textContent = 'Instalado';
      installBtn.disabled = true;
      installBtn.style.opacity = '0.6';
      installBtn.style.boxShadow = 'none';
    } else {
      installBtnText.textContent = 'Instalar';
      installBtn.disabled = false;
      installBtn.style.opacity = '';
      installBtn.style.boxShadow = '';
    }
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    updateInstallButton();
  });

  installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('PWA instalada correctamente');
    }
    deferredPrompt = null;
    updateInstallButton();
  });

  updateInstallButton();

  /* ----------------------------------------------------------
      INIT — Restore songs from IndexedDB on startup
   ---------------------------------------------------------- */
  restoreSongs();

  /* ----------------------------------------------------------
     SERVICE WORKER REGISTRATION
  ---------------------------------------------------------- */
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    });
  }

})();
