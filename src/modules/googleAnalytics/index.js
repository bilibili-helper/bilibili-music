/**
 * Author: DrowsyFlesh
 * Create: 2018/10/28
 * Description:
 */

import {Feature} from 'Libs/feature';
import _ from 'lodash';

export class GoogleAnalytics extends Feature {
    constructor() {
        super({
            name: 'googleAnalytics',
            kind: 'other',
            settings: {
                on: true,
                title: '数据统计',
                description: '匿名统计功能的使用情况，帮助开发者改进程序为您提供更好的体验',
            },
        });
    }

    permissionHandleLogin = (pass, msg) => {
        this.permissionMap.login = {pass, msg};
    };

    launch = () => {
        this.getLoginStatus()
            .then(this.insertGAScriptTag)
            .then(() => {
                this.send({
                    hitType: 'pageview',
                    page: 'background',
                });
            });
    };

    send = ({hitType, eventAction, eventCategory, eventLabel, nonInteraction, ...rest}) => {
        window.ga && window.ga('send', {
            hitType,
            eventAction,
            eventCategory,
            eventLabel,
            nonInteraction,
            ...rest,
        });
    };

    getLoginStatus = () => {
        return new Promise((resolve) => {
            chrome.cookies.get({
                url: 'http://interface.bilibili.com/',
                name: 'DedeUserID',
            }, (cookie) => {
                const thisSecond = (new Date()).getTime() / 1000;
                // expirationDate 是秒数
                //console.info(cookie);
                if (cookie && cookie.expirationDate > thisSecond) {
                    resolve(cookie.value);
                } else {
                    resolve();
                }
            });
        });
    };

    addListener = () => {
        chrome.runtime.onMessage.addListener((message) => {
            /**
             * 需要如下几个字段
             * action 表示操作类型 click init等
             * category 类别 功能名称等
             * label 功能中的具体项目名称等
             * nonInteraction 标记非交互
             */
            if (this.settings.on && message.command === 'setGAEvent' && message.action && message.category) {
                const {action: eventAction, label, category: eventCategory = '', nonInteraction = false} = message;
                this.getLoginStatus()
                    .then(this.insertGAScriptTag)
                    .then(() => {
                        this.send({
                            hitType: 'event',
                            eventAction,
                            eventCategory,
                            eventLabel: label,
                            nonInteraction,
                        });
                    });
            }
            return true;
        });
    };

    permissionHandleLogin = (value) => {
        if (value) {
            this.getLoginStatus()
                .then((userId) => {
                    window.ga('set', 'userId', userId);
                });
        } else {
            this.getStorage('userId').then(({userId}) => {
                if (!userId) {
                    userId = String(Math.random()).slice(2);
                    this.setStorage({userId}).then(() => userId);
                }
                window.ga('set', 'userId', userId);
            });
        }
    };

    insertGAScriptTag = (uid, UA = 'UA-39765420-6') => {
        return new Promise(resolve => {
            if (!uid) {
                resolve(this.getStorage('userId').then(({userId}) => {
                    if (userId) return userId;
                    else {
                        const userId = String(Math.random()).slice(2);
                        return this.setStorage({userId}).then(() => userId);
                    }
                }));
            } else resolve(uid);
        })
        .then((userId) => {
            if (document.getElementsByClassName('ga-script').length === 0) {
                const script = `https://www.google-analytics.com/analytics.js`;
                //const script = `https://www.google-analytics.com/analytics${debug ? '_debug' : ''}.js`;
                window['GoogleAnalyticsObject'] = 'ga';
                window.ga = window.ga || function() {
                    (window.ga.q = window.ga.q || []).push(arguments);
                };
                window.ga.l = 1 * new Date();
                const scriptTag = document.createElement('script');
                scriptTag.setAttribute('class', 'ga-script');
                scriptTag.setAttribute('async', 1);
                scriptTag.setAttribute('src', script);
                document.head.appendChild(scriptTag);
                window.ga('create', UA, 'auto');
                window.ga('set', 'checkProtocolTask');
                window.ga('set', 'userId', userId);
                window.ga('set', 'dimension1', chrome.runtime.getManifest().version);
            }
        });
    };
};
