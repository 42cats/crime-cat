const { EventEmitter } = require('events');
const DebugLogger = require('./DebugLogger');
const AudioEngineV4 = require('./AudioEngineV4');
const QueueManagerV4 = require('./QueueManagerV4');
const UIManagerV4 = require('./UIManagerV4');

class MusicPlayerV4 extends EventEmitter {
    constructor(guildId, client, user) {
        super();
        
        this.guildId = guildId;
        this.client = client;
        this.user = user;
        this.version = 'v4';
        
        this.logger = new DebugLogger('MusicPlayerV4', guildId);
        this.logger.info('🎵 Music Player v4 initializing...', { userId: user.id });
        
        this.audio = new AudioEngineV4(guildId, this);
        this.queue = new QueueManagerV4(guildId, this);
        this.ui = new UIManagerV4(guildId, this);
        
        this.state = {
            isPlaying: false,
            isPaused: false,
            volume: 0.5,
            mode: 'normal',
            currentIndex: -1,
            autoplay: true
        };
        
        this.uiState = {
            currentPage: 0,
            pageSize: 15
        };
        
        this.interactionMsg = null;
        this.lastInteraction = null;
        
        this.setupEventListeners();
        this.logger.info('✅ Music Player v4 initialized successfully');
    }

    setupEventListeners() {
        this.logger.debug('Setting up event listeners');
        
        this.audio.on('trackStart', (track) => {
            this.logger.playerEvent('Track started', { track: track.title });
            this.state.isPlaying = true;
            this.state.isPaused = false;
            this.updateUI('Track started');
        });
        
        this.audio.on('trackEnd', (reason) => {
            this.logger.playerEvent('Track ended', { reason });
            this.handleTrackEnd(reason);
        });
        
        this.audio.on('error', (error) => {
            this.logger.error('Audio engine error', error);
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.updateUI('Audio error');
        });
        
        this.logger.debug('Event listeners setup complete');
    }

    async play(index = null) {
        this.logger.trace('play', [index]);
        
        let targetIndex = index;
        if (targetIndex === null) {
            targetIndex = this.state.currentIndex >= 0 ? this.state.currentIndex : 0;
        }
        
        if (targetIndex < 0 || targetIndex >= this.queue.length) {
            this.logger.warn('Invalid track index', { index: targetIndex, queueLength: this.queue.length });
            return false;
        }
        
        const track = this.queue.getTrack(targetIndex);
        if (!track) {
            this.logger.warn('Track not found', { index: targetIndex });
            return false;
        }
        
        this.logger.userAction('play', { track: track.title, index: targetIndex });
        
        try {
            if (this.state.isPlaying) {
                await this.audio.stop();
            }
            
            this.state.currentIndex = targetIndex;
            this.state.isPlaying = false;
            this.state.isPaused = false;
            
            await this.audio.play(track, this.user);
            
            return true;
            
        } catch (error) {
            this.logger.error('Play failed', error);
            this.state.isPlaying = false;
            this.state.isPaused = false;
            return false;
        }
    }

    async togglePlayPause() {
        this.logger.trace('togglePlayPause');
        
        if (!this.state.isPlaying && !this.state.isPaused) {
            return await this.play();
        }
        
        if (this.state.isPaused) {
            const success = await this.audio.resume();
            if (success) {
                this.state.isPaused = false;
                this.state.isPlaying = true;
                this.logger.userAction('resume');
                await this.updateUI('Resumed');
            }
            return success;
        } else {
            const success = await this.audio.pause();
            if (success) {
                this.state.isPaused = true;
                this.state.isPlaying = false;
                this.logger.userAction('pause');
                await this.updateUI('Paused');
            }
            return success;
        }
    }

    async stop() {
        this.logger.trace('stop');
        
        const success = await this.audio.stop();
        
        if (success) {
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.logger.userAction('stop');
            await this.updateUI('Stopped');
        }
        
        return success;
    }

    async next() {
        this.logger.trace('next');
        
        const currentIndex = this.state.currentIndex;
        const nextIndex = this.queue.getNextIndex(currentIndex, this.state.mode);
        
        if (nextIndex === -1) {
            this.logger.debug('No next track available');
            if (this.state.mode === 'normal') {
                await this.stop();
            }
            return false;
        }
        
        return await this.play(nextIndex);
    }

    async prev() {
        this.logger.trace('prev');
        
        const currentIndex = this.state.currentIndex;
        const prevIndex = this.queue.getPreviousIndex(currentIndex, this.state.mode);
        
        if (prevIndex === -1) {
            this.logger.debug('No previous track available');
            return false;
        }
        
        return await this.play(prevIndex);
    }

    async handleTrackEnd(reason) {
        this.logger.trace('handleTrackEnd', [reason]);
        
        this.state.isPlaying = false;
        this.state.isPaused = false;
        
        if (reason === 'finished' && this.state.autoplay) {
            await this.next();
        } else {
            await this.updateUI('Track ended');
        }
    }

    async setVolume(volume) {
        this.logger.trace('setVolume', [volume]);
        
        const normalizedVolume = Math.max(0, Math.min(1, volume));
        const success = await this.audio.setVolume(normalizedVolume);
        
        if (success) {
            this.state.volume = normalizedVolume;
            this.logger.stateChange('volume', normalizedVolume);
            await this.updateUI('Volume changed');
        }
        
        return success;
    }
    
    async volumeUp(step = 0.1) {
        const newVolume = Math.min(1, this.state.volume + step);
        return await this.setVolume(newVolume);
    }
    
    async volumeDown(step = 0.1) {
        const newVolume = Math.max(0, this.state.volume - step);
        return await this.setVolume(newVolume);
    }

    async setMode(mode) {
        this.logger.trace('setMode', [mode]);
        
        const validModes = ['normal', 'repeat-one', 'repeat-all', 'shuffle'];
        if (!validModes.includes(mode)) {
            this.logger.warn('Invalid mode', { mode });
            return false;
        }
        
        const oldMode = this.state.mode;
        this.state.mode = mode;
        
        if (mode === 'shuffle' && oldMode !== 'shuffle') {
            this.queue.enableShuffle(this.state.currentIndex);
        } else if (mode !== 'shuffle' && oldMode === 'shuffle') {
            this.queue.disableShuffle();
        }
        
        this.logger.stateChange('mode', mode);
        await this.updateUI('Mode changed');
        
        return true;
    }

    async toggleMode() {
        const modes = ['normal', 'repeat-one', 'repeat-all', 'shuffle'];
        const currentIndex = modes.indexOf(this.state.mode);
        const nextIndex = (currentIndex + 1) % modes.length;
        
        return await this.setMode(modes[nextIndex]);
    }

    async toggleSort() {
        this.logger.trace('toggleSort');
        
        const success = await this.queue.sort();
        if (success) {
            await this.updateUI('Sort changed');
        }
        
        return success;
    }

    async toggleSource() {
        this.logger.trace('toggleSource');
        
        const currentSource = this.queue.source;
        const newSource = currentSource === 'youtube' ? 'local' : 'youtube';
        
        const success = await this.queue.loadFromSource(newSource, this.user?.id);
        
        if (success) {
            if (this.state.isPlaying || this.state.isPaused) {
                await this.stop();
            }
            
            this.state.currentIndex = -1;
            
            this.logger.userAction('source changed', { from: currentSource, to: newSource });
            await this.updateUI('Source changed');
        }
        
        return success;
    }

    async updateUI(reason = 'Update') {
        this.logger.trace('updateUI', [reason]);
        
        try {
            if (this.interactionMsg && this.interactionMsg.edit) {
                const uiData = this.ui.render(this.getFullState());
                await this.interactionMsg.edit(uiData);
                this.logger.debug('UI updated', { reason });
            }
        } catch (error) {
            this.logger.warn('UI update failed', error);
        }
    }

    toggleAutoplay() {
        this.state.autoplay = !this.state.autoplay;
        this.logger.stateChange('autoplay', this.state.autoplay);
        this.updateUI('Autoplay toggled');
        return this.state.autoplay;
    }

    getFullState() {
        const currentTrack = this.queue.getCurrentTrack();
        const queueInfo = this.queue.getInfo();
        
        return {
            ...this.state,
            currentTrack,
            queue: queueInfo,
            audio: this.audio.getStatus(),
            ui: this.uiState,
            version: this.version
        };
    }

    async reply() {
        this.logger.trace('reply');
        return this.ui.render(this.getFullState());
    }
    
    setPage(page) {
        const maxPage = Math.ceil(this.queue.length / this.uiState.pageSize) - 1;
        this.uiState.currentPage = Math.max(0, Math.min(page, maxPage));
        this.logger.userAction('Page changed', { page: this.uiState.currentPage });
        this.updateUI('Page changed');
    }
    
    goToFirstPage() {
        this.setPage(0);
    }
    
    goToLastPage() {
        const maxPage = Math.ceil(this.queue.length / this.uiState.pageSize) - 1;
        this.setPage(maxPage);
    }
    
    nextPage() {
        this.setPage(this.uiState.currentPage + 1);
    }
    
    prevPage() {
        this.setPage(this.uiState.currentPage - 1);
    }

    async destroy() {
        this.logger.info('🔚 Destroying Music Player v4...');
        const timer = this.logger.startTimer('destroy player');
        
        try {
            await this.audio.destroy();
            this.queue.clear();
            
            this.state.isPlaying = false;
            this.state.isPaused = false;
            this.state.currentIndex = -1;
            
            this.interactionMsg = null;
            this.lastInteraction = null;
            
            timer.end(true);
            this.logger.info('✅ Music Player v4 destroyed successfully');
            
        } catch (error) {
            this.logger.error('Destroy failed', error);
            timer.end(false);
        }
    }

    healthCheck() {
        const health = {
            status: 'healthy',
            version: this.version,
            guildId: this.guildId,
            isPlaying: this.state.isPlaying,
            isPaused: this.state.isPaused,
            currentIndex: this.state.currentIndex,
            queueLength: this.queue.length,
            audio: this.audio.getStatus(),
            queue: this.queue.getInfo(),
            uptime: process.uptime()
        };
        
        this.logger.debug('Health check', health);
        return health;
    }
}

module.exports = MusicPlayerV4;