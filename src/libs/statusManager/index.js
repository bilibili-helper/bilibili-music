/**
 * Author: DrowsyFlesh
 * Create: 2018/11/27
 * Description:
 */
import _ from 'lodash';
import * as globalStatuses from './status';

export class StatusManager {
    constructor() {
        this.permissionMap = {};
        this.statusMap = {}
        this.features = {};
        this.addListener();
    }

    init() {
        _.forEach(globalStatuses, (StatusClass) => {
            if (!StatusClass) { return console.warn('unknown status class'); }

            const statusClass = new StatusClass();
            this.statusMap[statusClass.name] = statusClass;
        });
    }

    isValidStatus(statusName) {
        return !!this.statusMap[statusName];
    }

    load(feature) {
        this.features[feature.name] = feature;
        return this.check(feature);
    }

    check(feature) {
        return new Promise(resolve => {
            let [pass, msg] = [true, '']; // 通过状态
            if (_.isEmpty(feature.permissions)) { resolve({pass, msg}); }// 没有设置需要检查的权限，则无条件通过
            Promise.all(_.map(feature.permissions, async (permissionStr) => {
                const permissionMap = permissionStr.split('?');
                const permissionName = permissionMap[0];
                if (this.isValidStatus(permissionName)) { // 未定义权限类型
                    const statusObject = this.statusMap[permissionName];
                    statusObject.addFeature(feature);
                    return statusObject.check(permissionMap[1]);
                } else {
                    return {pass: false, msg: `Undefined permission: ${permissionName}`};
                }
            })).then(checkResults => {
                const res = _.filter(checkResults, (res) => (res && !res.pass) || !res); // 过滤出权检未通过的项
                if (res.length > 0) { resolve({pass: false, data: res}); } // 如果有未通过权检的，则该feature设为权检失败
                else { resolve({pass: true, msg: ''}); }
            });
        });
    }

    addListener = () => {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            if (message.command === 'getPermissionMap') {
                sendResponse(this.permissionMap);
            }
            return true;
        });
    };
}
