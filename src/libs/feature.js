/* global process */
/**
 * Author: Ruo
 * Create: 2018/9/4
 * Description:
 */
import _ from 'lodash';
import store from 'store';

/**
 * 特性
 * 规范启用一个特性/功能需要涉及到的一系列方法
 */
export class Feature {

    /**
     * @param name {string} 配置的名称
     * @param kind {string} 配置的列表划分，在渲染设置页面时根据该值在相对应的列表中自动渲染，如：主站，直播，其他等
     * @param permissions {array}
     * @param dependencies {array}
     * @param settings {object} 特性的额外配置选项，如过滤列表的配置信息
     */
    constructor({name, kind, permissions = [], dependencies = [], settings = {}}) {
        this.name = name;
        this.optionStoreName = process.env.PREFIX ? `${process.env.PREFIX}-${this.name}` : this.name;
        this.dataStoreName = `in-module-${this.name}`;
        this.kind = kind;
        this.initialed = false;
        this.dependencies = dependencies;
        this.permissions = permissions;
        this.settings = {...settings, kind, name: this.name, permissions};
        this.permissionMap = {};
        _.each(this.permissions, (permissionName) => {
            this.permissionMap[permissionName] = {pass: false, msg: ''};
        });
        this.simplifyFilterList = [
            'description', 'title', 'permissions', 'dependencies',
            'type', 'hasUI', 'kind', 'name', 'hide', 'toggle',
        ];
    }

    get store() {
        const res = store.get(this.dataStoreName);
        if (res) { return res; } else {
            store.set(`${this.dataStoreName}`, undefined);
            return undefined;
        }
    }

    set store(v) {
        store.set(this.dataStoreName, v);
    }

    getSubStore(subStoreName) {
        const res = store.get(`${this.dataStoreName}-${subStoreName}`);
        if (res) { return res; } else {
            store.set(`${this.dataStoreName}-${subStoreName}`, undefined);
            return undefined;
        }
    }

    setSubStore(subStoreName, v) {
        store.set(`${this.dataStoreName}-${subStoreName}`, v);
    }


    get storage() {
        return new Promise((resolve) => {
            chrome.storage.sync.get(['uid'], function(storage) {
                resolve(storage);
            });
        });
    }

    getStorage(...keys) {
        return new Promise((resolve) => {
            chrome.storage.sync.get([...keys], function(storage) {
                resolve(storage);
            });
        });
    }

    setStorage(updateItem) {
        return new Promise((resolve, reject) => {
            chrome.storage.sync.set(updateItem, function() {
                chrome.runtime.lastError ? reject() : resolve();
            });
        });
    }

    /**
     * 初始化 - 位于装载过程之前
     * 1.检查(启动)配置
     * 2.鉴权
     * 3.配置初始化
     * @return {Promise} true 表示初始化成功 返回字符串表示初始化失败说明
     */
    init = () => {
        return new Promise((resolve) => {
            this.addListener();
            this.initialed = true;
            //console.warn(`模块初始化完毕：${this.name}`)
            this.settings.on && this.launch();
            resolve(this);
        });
    };

    setPermission = (name, value, msg) => {
        this.permissionMap[name] = {pass: value, msg};
        if (this.settings.on === false) { return; } // 如果feature没有启动，则不会触发launch或pause
        const f = this[`permissionHandle${_.upperFirst(name)}`];
        if (typeof f === 'function') { f(value, msg); }
    };

    // 初始化配置
    initSetting = (sets) => {
        return new Promise(resolve => {
            const localOptions = store.get(this.optionStoreName);
            const settings = this.mergeSetting(localOptions, sets); // 以本地存储的配置为基础合并入额外设置
            this.settings = this.mergeSetting(this.settings, settings);
            store.set(this.optionStoreName, this.simplifySetting(this.settings));
            resolve(this);
        });
    };

    /**
     * 获取配置
     * @param featureName
     * @return {undefined|Object}
     */
    getSetting = (featureName) => {
        if (featureName === this.name || !featureName) { return this.settings; } else {
            const feature = chrome.extension.getBackgroundPage().FeatureManager.features[featureName];
            if (feature) { return feature.getSetting(); }
            else { return undefined; }
        }
    };

    // 设置配置
    setSetting = (settings) => {
        this.settings = settings;
        store.set(this.optionStoreName, this.simplifySetting(settings));
        this.afterSetSetting(settings);
    };

    // 设置之后运行的钩子函数
    afterSetSetting = () => {};

    // 启动 - 装载过程之后
    launch = () => {};

    // 暂停 - 启动后关闭功能时调用
    pause = () => {};

    // 添加监听器
    addListener = () => {};

    /**
     * 合并配置，该操作以originSetting为模板，忽略originSetting中没有的键
     * @param originSetting 程序配置
     * @param localSetting 本地保存的配置
     */
    mergeSetting = (originObject, localObject) => {
        const tempObject = {};
        for (let key in originObject) {
            const value = originObject[key];
            if (_.isArray(value) && localObject !== undefined && _.isArray(localObject[key])) { // 处理options这种数组配置
                tempObject[key] = _.map(value, (object) => { // 以程序版本为模板
                    const local = _.find(localObject[key], (o) => o.key === object.key); // 查询在本地是否已有相关配置
                    if (local) { return this.mergeSetting(object, local); } // 查到则进行合并
                    else { return object; } // 查不到则以程序版本为准
                });
            } else if (_.isPlainObject(value) && localObject !== undefined && _.isPlainObject(localObject[key])) {
                tempObject[key] = this.mergeSetting(value, localObject[key]);
            } else if (localObject !== undefined && localObject[key] !== undefined) {
                tempObject[key] = localObject[key];
            } else {
                tempObject[key] = value;
            }
        }
        return tempObject;
    };

    /**
     * 简化配置，便于缓存
     * @param setting
     */
    simplifySetting = (setting) => {
        const tempObject = {};
        _.each(setting, (value, key) => {
            if (this.simplifyFilterList.indexOf(key) > -1) { return true; }
            if (_.isArray(value) && value.length > 0) {
                tempObject[key] = _.map(value, (o) => this.simplifySetting(o));
            } else if (_.isPlainObject(value)) {
                tempObject[key] = this.simplifySetting(value);
            } else {
                tempObject[key] = value;
            }
        });
        return tempObject;
    };

    /**
     * 获取当天日期，返回x号
     * 这里对时区问题进行特殊处理
     */
    getTodayDate = () => {
        const thisTime = new Date();
        const currentZone = thisTime.getTimezoneOffset() / 60;
        const offset = currentZone + 8; // 需要调整的偏移量
        return new Date(thisTime.getTime() - offset * 1000 * 60).getDate();
    };

    permissionHandleLogin = () => {};

    permissionHandleNotifications = () => {};

    permissionHandleDownloads = () => {};
}
