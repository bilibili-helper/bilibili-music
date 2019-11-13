/* global process */
/**
 * Author: DrowsyFlesh
 * Create: 2018/12/9
 * Description:
 */
import {Feature} from 'Libs/feature';
import API from './apis';
import {fetchJSON} from 'Utils/https';

//import {__, createTab, hasNewVersion, version, getURL} from 'Utils';

export class DataManager extends Feature {
    constructor() {
        super({
            name: 'dataManager',
            kind: 'other',
            settings: {
                on: true,
                hide: true,
                toggle: false,
            },
        });
        this.store = this.store || {};
        this.tempData = {};
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command = ''} = message;
            if (command === 'getData') {
                sendResponse(this.tempData);
            } else if (command === 'getMenuSong' && message.sid) {
                this.getSongMenu(message.sid, message.pn, message.ps)
                    .then(res => {
                        sendResponse(res);
                        console.warn(res, sender);
                        chrome.tabs.sendMessage(sender.tab.id, {command: 'menuSongData', data: res});
                    });
            }
            return true;
        });
    };

    launch = async () => {
        Promise.all([
            this.initAccount(),
            this.initBanner(),
            this.initHotRank(),
            this.initUserSongList(),
            this.initRecommendList(),
        ]).then(([accountData, banner, hotRank, userRank, recommendList]) => {
            this.tempData = {
                account: accountData,
                banner,
                hotRank,
                userRank,
                recommendList,
            };
            console.warn(this.tempData);
        });
    };

    /**
     * 用户数据
     * @returns {Promise<unknown>}
     */
    initAccount = () => fetchJSON(API.account);

    /**
     * banner
     * @returns {Promise<unknown>}
     */
    initBanner = () => fetchJSON(API.banner);

    /**
     * 热门榜单
     * @returns {Promise<unknown>}
     */
    initHotRank = () => fetchJSON(API.hotRank);

    /**
     * 用户歌单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initUserSongList = (pn = 1, ps = 5) => fetchJSON(`${API.userRank}?pn=${pn}&ps=${ps}`);

    /**
     * 推荐歌单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initRecommendList = (pn = 1, ps = 10) => fetchJSON(`${API.recommendList}?pn=${pn}&ps=${ps}`);

    /**
     * 推荐唱见
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initRecommendUser = (pn = 1, ps = 3) => fetchJSON(`${API.recommendUser}?pn=${pn}&ps=${ps}`);

    /**
     * 获取歌曲链接
     * @param sid
     * @param quality
     * @param privilege
     * @returns {Promise<unknown>}
     */
    getSongData = (sid, quality, privilege = 2) => fetchJSON(`${API.songData}?sid=${sid}&quality=${quality}&privilege=${privilege}`);

    /**
     * 获取歌单数据
     * @param sid
     * @param pn
     * @param ps
     */
    getSongMenu = (sid, pn = 1, ps = 100) => fetchJSON(`${API.songMenu}?sid=${sid}&pn=${pn}&ps=${ps}`);
}
