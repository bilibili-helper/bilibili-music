/**
 * Author: DrowsyFlesh
 * Create: 2019/11/21
 * Description:
 */
import API from 'Modules/player/apis';
import {createRandomInt, fetchJSON} from 'Utils';

export class MediaController {
    constructor(player, map = [], needInit = false) {
        this.player = player;
        this.startMedia = null;
        this.orderedEndMedia = null;
        this.randomEndMedia = null;

        this.mediaListCache = null; // 生成媒体渲染列表的缓存数据，每次更新后应该清理这个缓存

        this.map = needInit ? this.init(map) : new Map(map);

        this.locked = false;  // 修改互斥锁
        this.lockCommand = null; // 锁住的指令

        this.initBoundMedias();
    }

    toString() {
        return this.map.toString();
    }

    get(sid) {
        return this.map.get(sid);
    }

    lock = async (command = null) => {
        if (!command) return; // 无指令不上锁
        if (!this.locked) {
            this.locked = true;
            this.lockCommand = command;
        } else return Promise.reject(`locked by command: ${this.lockCommand}`);
    };

    unlock = () => {
        this.locked = false;
        this.lockCommand = null;
    };

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
        console.info(map);
        return map;
    }

    initBoundMedias = () => {
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

    // 往链表后面添加元素
    add = async (media, sameSkip = true) => {
        void this.lock('add');
        // 判断是否已经存在
        if (this.map.has(media.id) && sameSkip) {
            this.unlock();
            return Promise.resolve(this.map.get(media.id));
        }

        if (this.map.size === 0) { // 处理空表
            this.startMedia = media;
            this.orderedEndMedia = media;
            this.randomEndMedia = media;
        }

        // 更新和设置在有序链表中的下标
        media.orderedNext = (this.startMedia && this.startMedia.id) || media.id;
        media.orderedPrev = (this.orderedEndMedia && this.orderedEndMedia.id) || media.id;
        this.orderedEndMedia.orderedNext = media.id;
        this.startMedia.orderedPrev = media.id;

        // 更新和设置在无序链表中的下标
        media.randomNext = (this.startMedia && this.startMedia.id) || media.id;
        media.randomPrev = (this.randomEndMedia && this.randomEndMedia.id) || media.id;
        this.startMedia.randomPrev = media.id;
        this.randomEndMedia.randomNext = media.id;
        this.map.set(media.id, media);

        this.mediaListCache = null;

        this.unlock();

        return media;
    };

    delete = async ({id}) => {
        void this.lock('delete');
        const media = this.map.get(id);
        if (!media) {
            this.unlock();
            return Promise.reject(`没有找到id为「${id}」的媒体`);
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

        this.unlock();
        this.map.delete(id);
    };

    set2Current = async (media) => {
        const src = await this.getMediaSrc(media);
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

    getMediaList = () => this.mediaListCache || (this.mediaListCache = Array.from(this.map.values()));

    setMediaList = async (list = []) => {
        await this.lock('setMediaList');
        this.map = this.init(list);
        this.mediaListCache = null;
        this.initBoundMedias();
        this.unlock();
        return this.map;
    };

    addMediaList = async (list = []) => {
        await this.lock('addMediaList');
        do {
            if (list.length === 0) break;
            this.unlock();
            await this.add(list.shift());
        } while (list.length > 0);

        this.mediaListCache = null;
        this.initBoundMedias();
        this.unlock();
        return this.map;
    };

    clearMediaList = async () => {
        await this.lock('clearMediaList');
        this.map = new Map();
        this.mediaListCache = null;
        this.initBoundMedias();
        this.unlock();
        return this.map;
    };

    // 播放现有媒体
    play = async () => {
        await this.lock('play');
        const currentMedia = this.getCurrentMedia();
        if (!currentMedia) {
            this.unlock();
            return Promise.reject('没有可播放的媒体');
        }

        currentMedia.playing = true;
        if (this.player.src) {
            this.player.play();
            this.unlock();
        } else {
            return this.set2Current(currentMedia).then(this.unlock);
        }
    };

    pause = async () => {
        await this.lock('pause');
        const currentMedia = this.getCurrentMedia();
        if (this.player.src && currentMedia && currentMedia.playing) {
            currentMedia.playing = false;
            this.player.pause();
            this.unlock();
        } else {
            this.unlock();
            return Promise.reject('没有可暂停的媒体');
        }
    };

    // 重新设置并播放媒体
    setSong = async (media) => {
        await this.lock('setSong');
        const targetMedia = this.map.get(media.id);
        if (targetMedia) { // 播放列表中的媒体
            const currentMedia = this.getCurrentMedia();
            if (currentMedia) {
                currentMedia.playing = false;
            }
            return this.set2Current(targetMedia).then(this.unlock);
        } else {
            this.unlock();
            return this.add(media).then(this.set2Current).then(this.unlock);
        }
    };

    turnPrev = async (playMode) => {
        await this.lock('turnPrev');
        const currentMedia = this.getCurrentMedia();
        if (!currentMedia) {
            this.unlock();
            return Promise.reject('没有已选中媒体');
        }

        if (playMode === 0) { // 列表顺序播放
            console.info(currentMedia);
            const prev = this.map.get(currentMedia.orderedPrev);
            if (prev.id === this.orderedEndMedia.id) { // 已经是列表头
                chrome.runtime.sendMessage({
                    command: 'ended',
                    from: 'playerBackground',
                    song: currentMedia,
                    songList: this.getMediaList(),
                });
            } else await this.set2Current(prev);

        } else if (playMode === 1) { // 列表循环
            const prev = this.map.get(currentMedia.orderedPrev);
            await this.set2Current(prev);
        } else if (playMode === 2) { // 单曲循环
            await this.set2Current(currentMedia);
        } else if (playMode === 3) { // 随机播放
            const prev = this.map.get(currentMedia.randomPrev);
            await this.set2Current(prev);
        }
        this.unlock();
    };

    turnNext = async (playMode) => {
        await this.lock('turnNext');
        const currentMedia = await this.getCurrentMedia();
        if (!currentMedia) {
            this.unlock();
            return Promise.reject('没有已选中媒体');
        }

        if (playMode === 0) { // 列表顺序播放，到列表底部则自动暂停
            const next = this.map.get(currentMedia.orderedNext);
            if (next.id === this.startMedia.id) { // 不是列表中最后一个媒体
                chrome.runtime.sendMessage({
                    command: 'ended',
                    from: 'playerBackground',
                    song: currentMedia,
                    songList: this.getMediaList(),
                });
            } else await this.set2Current(next);
        } else if (playMode === 1) {
            const next = this.map.get(currentMedia.orderedNext);
            await this.set2Current(next);
        } else if (playMode === 2) {
            await this.set2Current(currentMedia);
        } else if (playMode === 3) {
            const next = this.map.get(currentMedia.randomNext);
            await this.set2Current(next);
        }
        this.unlock();
    };

    /**
     * 获取媒体链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    getMediaSrc = async (media, quality = 2, privilege = 2) => {
        return await fetchJSON(`${API.src}?sid=${media.id}&quality=${quality}&privilege=${privilege}`).then(res => res.cdns[0]);
    };
}
