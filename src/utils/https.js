/**
 * Author: DrowsyFlesh
 * Create: 2019/11/13
 * Description:
 */
export const fetchJSON = (url, options) => {
    const RETRY_DELAY = 1000; // ms
    const RETRY_MAX = 3;
    let retryTime = 0;
    const request = () => {
        return fetch(url, {...options})
        .then((res => res.json()))
        .then(res => {
            if (res.code === 0) {
                return res.data;
            } else {
                return Promise.reject(res.msg);
            }
        })
        .catch((error) => {
            if (RETRY_MAX > retryTime) {
                retryTime += 1;
                return setTimeout(request, RETRY_DELAY);
            } else {
                console.error(error);
                return error;
            }
        });
    };
    return request();
};
export const fetchText = (url, options) => {
    const RETRY_DELAY = 1000; // ms
    const RETRY_MAX = 3;
    let retryTime = 0;
    const request = () => {
        return fetch(url, {...options})
        .then(res => {
            console.warn(res);
            return res;
            //if (res.status === 0) {
            //    return res.data;
            //} else {
            //    return Promise.reject(res.msg);
            //}
        })
        .then((res => res.text()))
        .catch((error) => {
            if (RETRY_MAX > retryTime) {
                retryTime += 1;
                return setTimeout(request, RETRY_DELAY);
            } else {
                console.error(error);
                return error;
            }
        });
    };
    return request();
}
