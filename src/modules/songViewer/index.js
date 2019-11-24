/**
 * Author: DrowsyFlesh
 * Create: 2019/11/20
 * Description:
 */
import {Feature} from 'Libs/feature';
import {fetchJSON} from 'Utils/https';
import API from './apis';

export class SongViewer extends Feature {
    constructor() {
        super({
            name: 'songViewer',
            kind: 'popup',
            dependencies: ['popupAnchor', 'googleAnalytics'],
            settings: {
                on: true,
                hide: true,
                hasUI: true,
                toggle: false,
            },
        });

        this.current = null;
        this.cache = {}; // 缓存30分钟
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = '', from = ''} = message;
            if (command === 'viewSong' && message.sid) { // 查看媒体详情
                this.getSongDetail(message.sid).then((song) => {
                    chrome.runtime.sendMessage({
                        command: 'setSongViewSuccessfully',
                        from: 'playerBackground',
                        song,
                    });
                });
            }
            return true;
        });
    };

    /**
     * 生成到期时间
     * @param duration // 有效时长，分钟
     * @returns {*}
     */
    createExpiredTime = (duration = 30) => Date.now() + 3600000 * duration;

    /**
     * 获取媒体数据，缓存优先，缓存30分钟
     * @param sid
     * @returns {Promise<unknown>}
     */
    getSongDetail = (sid) => {
        if (!sid) {
            return Promise.reject(`error sid: ${sid}`);
        }
        const cache = this.cache[sid];
        if (cache && cache.expiredTime >= Date.now()) {
            return Promise.resolve(cache);
        }

        // 缓存不存在或已经过期
        return Promise.all([
            this.getBasicData(sid),
            this.getTags(sid),
            this.getMembers(sid),
            this.getStartStatus(sid),
        ]).then(([basic, tags, members]) => {
            return this.cache[sid] = {
                ...basic,
                tags,
                members,
                expiredTime: Date.now() + this.createExpiredTime(),
            };
        });

    };

    // 获取媒体基础信息
    getBasicData = (sid) => fetchJSON(`${API.basic}?sid=${sid}`);

    // 获取媒体基础信息
    getTags = (sid) => fetchJSON(`${API.tags}?sid=${sid}`);

    // 获取媒体创作成员名单
    getMembers = (sid) => fetchJSON(`${API.members}?sid=${sid}`);

    // 获取媒体创作成员名单
    getStartStatus = (sid) => fetchJSON(`${API.starStatus}?sid=${sid}`);

    getSimilar = (sid) => fetchJSON(`${API.similar}?sid=${sid}`);

}
