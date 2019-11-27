/**
 * Author: DrowsyFlesh
 * Create: 2019/11/21
 * Description:
 */
import API from './apis';
import {createRandomInt, fetchJSON} from 'Utils';

export class MediaController {
    constructor(player, map = [], needInit = false, startMedia = null, orderedEndMedia = null, randomEndMedia = null) {
        this.player = player;
        this.startMedia = startMedia;
        this.orderedEndMedia = orderedEndMedia;
        this.randomEndMedia = randomEndMedia;

        this.mediaListCache = null; // 生成媒体渲染列表的缓存数据，每次更新后应该清理这个缓存

        this.map = needInit ? this.init(map) : new Map(map);

        this.locked = false;  // 修改互斥锁
        this.lockCommand = null; // 锁住的指令

        this.__initBoundMedias();
    }

    get(sid) {
        return this.map.get(sid);
    }

    init(mediaList) {
        if (mediaList.length === 0) return new Map();
        const ordered = mediaList.map((item, index) => {
            // 生成顺序链条
            if (!mediaList[index - 1]) { // 是第一个，前面没有其他元素
                this.startMedia = item;
                item.current = true;
                item.orderedPrev = mediaList[mediaList.length - 1].id;
                item.orderedNext = mediaList[index + 1].id;
            } else if (!mediaList[index + 1]) { // 是最后一个，后面没有其他元素
                item.orderedPrev = mediaList[index - 1].id;
                item.orderedNext = mediaList[0].id;
            } else {
                item.orderedPrev = mediaList[index - 1].id;
                item.orderedNext = mediaList[index + 1].id;
            }

            return [item.id, item];
        });

        // 生成乱序链表, 交换法
        const map = new Map(ordered);
        const tempList = Array.from(map.values());
        let randomPrev = null;
        let randomFirst = null;
        do {
            const itemIndex = createRandomInt(0, tempList.length);
            const item = tempList.splice(itemIndex, 1)[0];

            if (!randomFirst) {
                randomFirst = item;
                randomPrev = item;
            } else {
                item.randomPrev = randomPrev.id;
                randomPrev.randomNext = item.id;
            }

            if (tempList.length === 0) { // 列表处理完
                randomPrev.randomNext = item.id;
                item.randomPrev = randomPrev.id;
                item.randomNext = randomFirst.id;
                randomFirst.randomPrev = item.id;
                break;
            }

            randomPrev = item;
        } while (tempList.length >= 0);
        return map;
    }

    __lock = async (command = null) => {
        if (!command) return; // 无指令不上锁
        if (!this.locked) {
            this.locked = true;
            this.lockCommand = command;
        } else return Promise.reject(`locked by command: ${this.lockCommand} when run ${command}`);
    };

    __unlock = () => {
        this.locked = false;
        this.lockCommand = null;
    };

    __initBoundMedias = () => {
        const values = Array.from(this.map.values());
        if (values.length > 0) {
            this.startMedia = values[0];
            this.orderedEndMedia = this.map.get(this.startMedia.orderedPrev);
            this.randomEndMedia = this.map.get(this.startMedia.randomPrev);
        } else {
            this.startMedia = null;
            this.orderedEndMedia = null;
            this.randomEndMedia = null;
        }
    };

    getCurrentMedia = () => Array.from(this.map.values()).find(m => m.current);

    /**
     * 获取媒体链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    __getMediaSrc = async (media, quality = 2, privilege = 2) => {
        return await fetchJSON(`${API.src}?sid=${media.id}&quality=${quality}&privilege=${privilege}`).then(res => res.cdns[0]);
    };

    __set2Current = async (media) => {
        const src = await this.__getMediaSrc(media);
        const currentMedia = this.getCurrentMedia();
        if (currentMedia) {
            currentMedia.current = false;
            currentMedia.playing = false;
        }
        media.current = true;
        media.playing = true;

        this.mediaListCache = null;
        this.player.src = src;
    };

    // 设置当前要播放的媒体
    __set = async (media) => {
        const currentMedia = this.getCurrentMedia();
        if (currentMedia) {
            currentMedia.playing = false;
        }
        return this.__set2Current(media);
    };

    // 往链表后面添加元素
    __add = async (media, sameSkip = true) => {
        // 判断是否已经存在
        if (this.map.has(media.id) && sameSkip) {
            return Promise.resolve(this.map.get(media.id));
        }

        if (this.map.size === 0) { // 处理空表
            this.startMedia = media;
            this.orderedEndMedia = media;
            this.randomEndMedia = media;
        }

        // 更新和设置在有序链表中的下标
        media.orderedPrev = this.orderedEndMedia.id;
        this.orderedEndMedia.orderedNext = media.id;
        media.orderedNext = this.startMedia.id;
        this.startMedia.orderedPrev = media.id;

        // 更新和设置在无序链表中的下标
        media.randomNext = (this.startMedia && this.startMedia.id) || media.id;
        media.randomPrev = (this.randomEndMedia && this.randomEndMedia.id) || media.id;
        this.startMedia.randomPrev = media.id;
        this.randomEndMedia.randomNext = media.id;
        this.map.set(media.id, media);

        this.mediaListCache = null;
        return media;
    };

    __delete = async ({id}) => {
        const media = this.map.get(id);
        if (!media) {
            this.__unlock();
            return Promise.resolve(`没有找到id为「${id}」的媒体`);
        }

        // ordered
        const orderedPrev = media.orderedPrev;
        const orderedNext = media.orderedNext;
        this.map.get(orderedPrev).orderedNext = orderedNext;
        this.map.get(orderedNext).orderedPrev = orderedPrev;

        // random
        const randomPrev = media.randomPrev;
        const randomNext = media.randomNext;
        this.map.get(randomPrev).randomNext = randomNext;
        this.map.get(randomNext).randomPrev = randomPrev;

        this.mediaListCache = null;

        if (media.playing) {
            this.player.pause();
        }

        this.map.delete(id);
    };

    getMediaList = () => this.mediaListCache || (this.mediaListCache = Array.from(this.map.values()));

    setMediaList = async (list = []) => {
        await this.__lock('setMediaList');
        this.map = this.init(list);
        this.mediaListCache = null;
        this.__initBoundMedias();
        this.__set(this.startMedia);
        this.__unlock();
    };

    addMediaList = async (list = []) => {
        await this.__lock('addMediaList');
        do {
            if (list.length === 0) break;
            this.__unlock();
            await this.__add(list.shift(), true);
        } while (list.length > 0);

        this.mediaListCache = null;
        this.__initBoundMedias();
        this.__unlock();
        return this.map;
    };

    clearMediaList = async () => {
        await this.__lock('clearMediaList');
        this.map = new Map();
        this.mediaListCache = null;
        this.__initBoundMedias();
        this.__unlock();
        return this.map;
    };

    // 播放现有媒体
    play = async () => {
        await this.__lock('play');
        const currentMedia = this.getCurrentMedia();
        if (!currentMedia) {
            this.__unlock();
            return Promise.reject('没有可播放的媒体');
        }

        currentMedia.playing = true;
        if (this.player.src) {
            this.player.play();
        } else {
            await this.__set(currentMedia);
        }
        this.__unlock();
    };

    pause = async () => {
        await this.__lock('pause');
        const currentMedia = this.getCurrentMedia();
        if (this.player.src && currentMedia && currentMedia.playing) {
            currentMedia.playing = false;
            this.player.pause();
            this.__unlock();
        } else {
            this.__unlock();
            return Promise.resolve('没有可暂停的媒体');
        }
    };

    // 重新设置并播放媒体
    setSong = async (media) => {
        await this.__lock('setSong');
        await this.__add(media, true).then(this.__set);
        await this.__initBoundMedias();
        await this.__unlock();
    };

    addSong = async (media) => {
        await this.__lock('addSong');
        await this.__add(media, true);
        await this.__initBoundMedias();
        await this.__unlock();
    };

    deleteSong = async (media) => {
        await this.__lock('deleteSong');
        await this.__delete(media);
        await this.__initBoundMedias();
        await this.__unlock();
    };

    turn = async (direction, playMode) => {
        const currentMedia = this.getCurrentMedia();
        if (!currentMedia) {
            this.__unlock();
            return Promise.reject('没有已选中媒体');
        }

        let orderedMediaId = null;
        let randomMediaId = null;
        let bounderMediaId = null;
        if (direction === 'prev') {
            await this.__lock('turnPrev');
            orderedMediaId = currentMedia.orderedPrev;
            randomMediaId = currentMedia.randomPrev;
            bounderMediaId = this.orderedEndMedia.id;
        } else if (direction === 'next') {
            await this.__lock('turnNext');
            orderedMediaId = currentMedia.orderedNext;
            randomMediaId = currentMedia.randomNext;
            bounderMediaId = this.startMedia.id;
        }

        if (playMode === 0) { // 列表顺序播放
            const media = this.map.get(orderedMediaId);
            if (media.id === bounderMediaId) { // 已经是列表头
                chrome.runtime.sendMessage({
                    command: 'ended',
                    from: 'playerBackground',
                    song: currentMedia,
                    songList: this.getMediaList(),
                });
            } else await this.__set2Current(media);
        } else if (playMode === 1) { // 列表循环
            const media = this.map.get(orderedMediaId);
            await this.__set2Current(media);
        } else if (playMode === 2) { // 单曲循环
            await this.__set2Current(currentMedia);
        } else if (playMode === 3) { // 随机播放
            const media = this.map.get(randomMediaId);
            await this.__set2Current(media);
        }
        this.__unlock();
    };

    turnPrev = async (playMode) => {
        return await this.turn('prev', playMode);
    };

    turnNext = async (playMode) => {
        return await this.turn('next', playMode);
    };
}
