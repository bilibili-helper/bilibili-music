import API from 'Modules/dataManager/apis';
import {getCSRF} from 'Utils/cookies';
import {av2bv, bv2av} from 'Utils/functions';
import {fetchJSON, fetchText} from 'Utils/https';


const VIDEO_MEMBER_MAP = {
    'UP主': 1000,
    '视频制作': 1001,
};

/**
 * Author: DrowsyFlesh
 * Create: 2019/11/27
 * Description:
 */
export class DataManager {
    constructor() {

        this.addListener();
        void this.initData();

        this.tempSongMenu = null;
        this.tempSongMenuMediaList = null;
    }

    __lock = (command = null) => {
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

    addListener = () => {
        chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
            const {command = ''} = message;
            if (command === 'getData') {
                sendResponse(this.tempData);
            } else if (command === 'getSongMenu' && message.songMenu) {
                this.getSongMenu(message.songMenu.menuId, message.pn, message.ps)
                    .then(res => {
                        this.tempSongMenu = message.songMenu;
                        this.tempSongMenuMediaList = res;
                        chrome.runtime.sendMessage({
                            command: 'updateSongMenuSuccessfully',
                            from: 'dataManager',
                            mediaList: this.tempSongMenuMediaList,
                            songMenu: this.tempSongMenu,
                        });
                        sendResponse(res);
                    });
            } else if (command === 'starSongMenu' && message.songMenu) {
                this.starSongMenu(message.songMenu)
                    .then(() => {
                        chrome.runtime.sendMessage({
                            command: 'starSongMenuSuccessfully',
                            from: 'dataManager',
                            data: this.tempData,
                        });
                    });
            } else if (command === 'unStarSongMenu' && message.songMenu) {
                this.unStarSongMenu(message.songMenu)
                    .then(() => {
                        chrome.runtime.sendMessage({
                            command: 'unStarSongMenuSuccessfully',
                            from: 'dataManager',
                            data: this.tempData,
                        });
                    });
                return true;
            } else if (command === 'getVideoData' && message.id) {
                this.getVideo(message.id).then(res => sendResponse(res));
            }
        });
    };
    initData = () => {
        return Promise.all([
            this.initAccount(),
            this.initBanner(),
            this.initHotRank(),
            this.initUserSongMenu(),
            this.initRecommendList(),
            this.initUserCollectedMenu(),
            this.initAllRank(),
        ]).then(([accountData, banner, hotRank, userMenu, recommendList, userCollectedMenu, allRank]) => {
            this.tempData = {
                account: accountData,
                banner,
                hotRank,
                userMenu,
                recommendList,
                userCollectedMenu,
                allRank,
            };
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
     * 全部榜单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initAllRank = (pn = 1, ps = 5) => {
        const resultDataList = [];
        const get = (pn, ps) => {
            return fetchJSON(`${API.allRank}?pn=${pn}&ps=${ps}`)
            .then(({curPage, pageCount, data}) => {
                resultDataList.push(...data);
                if (curPage < pageCount) {
                    return get(pn + 1, ps);
                } else {
                    return resultDataList;
                }
            });
        };
        return get(pn, ps);
    };

    /**
     * 用户歌单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initUserSongMenu = (pn = 1, ps = 5) => {
        const resultDataList = [];
        const get = (pn, ps) => {
            return fetchJSON(`${API.userSongMenu}?pn=${pn}&ps=${ps}`)
            .then(({curPage, pageCount, data}) => {
                resultDataList.push(...data);
                if (curPage < pageCount) {
                    return get(pn + 1, ps);
                } else {
                    return resultDataList;
                }
            });
        };
        return get(pn, ps);
    };

    /**
     * 用户收藏歌单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initUserCollectedMenu = (pn = 1, ps = 5) => {
        const resultDataList = [];
        const get = (pn, ps) => {
            return fetchJSON(`${API.userCollectedMenu}?pn=${pn}&ps=${ps}`)
            .then((res) => {
                if (res) {
                    const {curPage, pageCount, data} = res;
                    resultDataList.push(...data);
                    if (curPage < pageCount) {
                        return get(pn + 1, ps);
                    } else {
                        return resultDataList;
                    }
                } else return resultDataList;
            });
        };
        return get(pn, ps);
    };

    /**
     * 推荐歌单
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initRecommendList = (pn = 1, ps = 10) => {
        const resultDataList = [];
        const idMap = {};
        const get = (pn, ps) => {
            return fetchJSON(`${API.recommendList}?pn=${pn}&ps=${ps}`)
            .then(({totalSize, data}) => {
                data.forEach((menu) => {
                    if (!idMap[menu.menuId]) {
                        idMap[menu.menuId] = true;
                        resultDataList.push(menu);
                    }
                });
                if (resultDataList.length < totalSize) {
                    return get(pn + 1, ps);
                } else {
                    return resultDataList;
                }
            });
        };
        return get(pn, ps);
    };

    /**
     * 推荐唱见
     * @param pn
     * @param ps
     * @returns {Promise<unknown>}
     */
    initRecommendUser = (pn = 1, ps = 3) => fetchJSON(`${API.recommendUser}?pn=${pn}&ps=${ps}`);

    /**
     * 获取歌单数据
     * @param sid
     * @param pn
     * @param ps
     */
    getSongMenu = (sid, pn = 1, ps = 100) => {
        const resultDataList = [];
        const get = (pn, ps) => {
            return fetchJSON(`${API.songMenu}?sid=${sid}&pn=${pn}&ps=${ps}`)
            .then(({curPage, pageCount, data}) => {
                data = data.map(({...rest}) => ({type: 'audio', ...rest}));
                resultDataList.push(...data);
                if (curPage < pageCount) {
                    return get(pn + 1, ps);
                } else {
                    return resultDataList;
                }
            });
        };
        return get(pn, ps);
    };

    /**
     * 收藏歌单
     * @param menuId
     */
    starSongMenu = ({menuId: sid}) => {
        return getCSRF().then((csrf) => {
            const formData = new FormData();
            formData.set('sid', sid);
            formData.set('csrf', csrf);
            return fetchJSON(API.starSongMenu, {method: 'POST', body: formData})
            .then(res => {
                if (res) {
                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            })
            .then(this.initUserCollectedMenu)
            .then((userCollectedMenu) => {
                this.tempData.userCollectedMenu = userCollectedMenu;
            });
        });
    };

    /**
     * 取消收藏歌单
     * @param menuId
     */
    unStarSongMenu = ({menuId: sid}) => {
        return getCSRF().then((csrf) => {
            return fetchJSON(`${API.starSongMenu}?sid=${sid}`, {
                method: 'DELETE',
                body: `csrf=${csrf}`,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            })
            .then(res => {
                if (res) {
                    return Promise.resolve();
                } else {
                    return Promise.reject();
                }
            })
            .then(this.initUserCollectedMenu)
            .then((userCollectedMenu) => {
                this.tempData.userCollectedMenu = userCollectedMenu;
            });
        });
    };

    updateSongMenu = () => {
        if (this.tempSongMenu) {
            return this.getSongMenu(this.tempSongMenu.menuId)
                       .then(res => {
                           this.tempSongMenuMediaList = res;
                           return {
                               songMenu: this.tempSongMenu,
                               mediaList: this.tempSongMenuMediaList,
                           };
                       });
        } else { // 如果并没有展开过媒体列表，则直接忽略，只有收藏媒体列表的媒体才需要更新和发送这部分数据
            return Promise.resolve({});
        }
    };

    /**
     * 检查指定type的视频id是否有效，有效则以song的数据结构返回视频数据
     * @param videoId
     * @param type
     */
    getVideo = (videoId) => {
        return this.getVideoByBvid(videoId).then(res => {
            if (res.match('啊叻？视频不见了？')) {
                return false;
            } else {
                //console.info(res);
                const videoInfoRegExpResult = /window\.__INITIAL_STATE__=(.+?);\(function\(/.exec(res);
                const playInfoRegExpResult = /window\.__playinfo__=(.+?)<\/script>/.exec(res);
                if (videoInfoRegExpResult) {
                    try {
                        const videoInfo = JSON.parse(videoInfoRegExpResult[1]).videoData;
                        const playInfo = JSON.parse(playInfoRegExpResult[1]);
                        if (playInfo.code === 0 && playInfo.data.dash) {
                            console.info(videoInfo);
                            let members;
                            if (videoInfo.staff) {
                                members = videoInfo.staff.map(({title, mid, name}) => ({
                                    list:[{
                                        mid: 0,
                                        member_id: mid,
                                        name: name,
                                    }],
                                    type: VIDEO_MEMBER_MAP[title],
                                }));
                            } else if (videoInfo.owner) {
                                members = [{
                                    list: [{
                                        mid: 0,
                                        member_id: videoInfo.owner.mid,
                                        name: videoInfo.owner.name,
                                    }],
                                    type: VIDEO_MEMBER_MAP['UP主'],
                                }]
                            }
                            return videoInfo.aid ? {
                                aid: videoInfo.aid,
                                author: videoInfo.owner.name,
                                bvid: videoInfo.bvid,
                                cid: videoInfo.cid,
                                cover: videoInfo.pic,
                                duration: videoInfo.duration,
                                id: videoInfo.aid,
                                title: videoInfo.title,
                                intro: videoInfo.desc,
                                uname: videoInfo.owner.name,
                                uid: videoInfo.owner.mid,
                                type: 'video',
                                members,
                                url: playInfo.data.dash.audio[0].baseUrl + '&requestFrom=bilibili-music&requestType=audioFromVideo',
                            } : false;
                        }
                    } catch (e) {
                        console.error(e);
                        return false;
                    }
                }
            }
        });
    };

    getVideoByBvid = (videoId, options = {}) => {
        return fetchText(`https://www.bilibili.com/video/${videoId}`, options);
    };
}
