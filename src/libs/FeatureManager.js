/**
 * Author: DrowsyFlesh
 * Create: 2018/10/23
 * Description:
 */

import _ from 'lodash';
import {StatusManager} from 'Libs/statusManager';
import {StoreManager} from 'Libs/StoreManager';

export class FeatureManager {
    constructor() {
        this.features = {};
        this.waitQueue = [];
    }

    init(features) {
        this.statusManager = new StatusManager();
        this.storeManager = new StoreManager();
        this.statusManager.init();
        this.instantiateFeatures(features).then(this.loadFeatures);
        this.retryMax = _.keys(features).length;
        this.retryTime = 0;

        this.addListener();
        return this;
    }

    // 实例化所有Feature，not include init function
    instantiateFeatures = (features) => {
        return new Promise(resolve => {
            _.each(features, (FeatureClass, featureName) => {
                if (!this.features[_.lowerFirst(featureName)]) {
                    if (!FeatureClass) {
                        console.warn(`Feature ${featureName}'s feature class is not defined!`);
                    } else {
                        this.features[_.lowerFirst(featureName)] = new FeatureClass();
                    }
                } else { throw `Feature ${featureName} has instantiated!`; }
            });
            resolve();
        });
    };

    // 特性模块列表载入
    loadFeatures = () => {
        return Promise.all(_.map(this.features, async (feature, featureName) => {
            const {dependencies} = feature;
            const checkResult = this.checkModuleRequire(dependencies);
            if (checkResult) {
                return this.loadFeature(featureName);
            } else {
                this.waitQueue.push({dependencies, featureName});
                return false;
            }
        })).then(() => {
            this.dealWidthWaitQueue();
        });
    };

    // 单个模块载入
    loadFeature = (featureName) => {
        return new Promise(resolve => {
            this.features[featureName].initSetting().then(feature => {
                const {name, settings} = feature;
                if (settings === undefined || settings.on === undefined) { // 缺少启动项配置
                    console.error(`No settings names ${name}`);
                    resolve(false);
                }/* else if (!settings.on) { // 功能未启用
                    resolve(false);
                }*/ else {
                    this.statusManager.load(feature).then(({pass}) => {
                        if (pass) { // 鉴权通过
                            feature.init();
                            resolve(true);
                        } else { // 鉴权未通过
                            //console.error(`Feature ${name}: ${_.map(data, o => o.msg).join(', ')}`);
                            resolve(false);
                        }
                    });
                }
            });
        });
    };

    // 处理等待队列
    dealWidthWaitQueue = () => {
        if (this.retryTime > this.retryMax) {
            return;
        }
        ++this.retryTime;
        const newWaitQueue = [];
        const promiseList = _.map(this.waitQueue, (FeatureDefineObject) => {
            return new Promise(resolve => {
                const {dependencies, featureName} = FeatureDefineObject;
                if (this.checkModuleRequire(dependencies)) { // 依赖检查通过
                    const loadResult = this.loadFeature(featureName);
                    resolve(loadResult);
                } else {
                    newWaitQueue.push(FeatureDefineObject);
                    resolve(false);
                }
            });
        });
        this.waitQueue = newWaitQueue;
        Promise.all(promiseList).then(() => this.waitQueue.length > 0 && this.dealWidthWaitQueue());
    };

    // 依赖检查 全部通过返回true
    checkModuleRequire = (requireList = []) => {
        if (requireList.length === 0) {
            return true;
        }
        let counter = requireList.length;
        _.map(requireList, (requireName) => {
            if (this.features[requireName]) {
                this.features[requireName].initialed && --counter;
            } else {
                console.error(`Invalid Feature: ${requireName}`);
            }
        });
        return counter === 0;
    };

    // 绑定相关监听事件
    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            const {command} = message;
            switch (command) {
                /**
                 * 获取Feature的配置
                 * feature: 如果指定feature则优先返回指定名称的Feature的配置
                 * kind: 如果指定kind则返回指定kind那一类Feature的配置
                 * checkHide: 如果设置checkHide为true，则忽略那些配置有checkHide的Feature
                 * hasUI: 只获取有该setting配置的Feature
                 * 如果没有给任何其他参数，则返回所有Feature的配置列表
                 */
                case 'getSettings': {
                    let features;
                    const {feature, kind, checkHide, hasUI} = message;
                    if (feature) { // 返回单个feature的配置
                        features = _.filter(this.features, f => feature === f.settings.name);
                    } else if (kind) { // 返回一类feature的配置
                        features = _.filter(this.features, f => kind === f.settings.kind);
                    } else {
                        features = this.features;
                    }
                    if (checkHide) { features = _.filter(features, f => !f.settings.hide); } // 返回不在设置页面隐藏配置项的feature的配置
                    if (hasUI) { features = _.filter(features, ({settings}) => settings.hasUI); } // 返回带有UI的feature的配置

                    const settings = {};
                    _.each(features, (feature) => {
                        const setting = feature.getSetting();
                        settings[setting.name] = setting;
                    });
                    sendResponse(settings);
                    break;
                }
                case 'inIncognitoContext': {
                    sendResponse(chrome.extension.inIncognitoContext);
                    break;
                }
                case 'setSetting':
                case 'getSetting': {
                    const {feature: featureName, settings} = message;
                    const feature = this.features[featureName];
                    if (!feature) {
                        console.error(`Error feature name: ${featureName}`);
                        return sendResponse(false);
                    }
                    if (command === 'setSetting' && featureName === feature.name && !_.isEmpty(settings)) { // 设置单个功能的配置
                        if (!feature.initialed && settings.on === true) { feature.init(); }  // 没有初始化过
                        if (feature.initialed && settings.on !== feature.settings.on) { // 总启动状态发生变化时
                            if (settings.on === true && feature.settings.on === false) {
                                feature.launch();
                            } else { feature.pause(); }
                        }
                        feature.setSetting(settings);
                        sendResponse(true);
                    } else if (command === 'getSetting' && featureName === feature.name) { // 获取单个功能的配置
                        sendResponse(feature.settings);
                    }
                    break;
                }
                case 'getFeatureStore': {
                    const {feature: featureName} = message;
                    const feature = this.features[featureName];
                    if (feature) { sendResponse(feature.store); }
                    break;
                }
            }
            return true;
        });
    };
}
