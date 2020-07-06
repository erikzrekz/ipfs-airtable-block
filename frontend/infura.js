function urlBuilder(path, params) {
    const base = 'https://ipfs.infura.io:5001/api/v0/';

    var _url = base + path;
    var url = new URL(_url);
    var params = params;

    url.search = new URLSearchParams(params).toString();
    return url;
}

/**
 * Function that adds JSON to IPFS using Infura API
 * @param {Object} data
 * @return {Object}
 */
async function _add(data) {
    let url = urlBuilder('add');

    let options = {
        'method': 'POST',
        'cors': true,
    }

    options.body = new FormData();
    let dataString = JSON.stringify(data)
    options.body.append('', dataString.trim());

    let response = await fetch(url, options);
    let responseData = await response.json();
    if (responseData && responseData.Hash) {
        return responseData.Hash
    } else {
        return 'Unexpected response. Please check console.'
    }
}

/**
 * Function that gets data from IPFS using Infura API
 * @param {String} cid
 * @return {Object}
 */
async function _get(cid) {
    let url = urlBuilder('object/get', {'arg': cid});

    let options = {
        'method': 'GET',
        'cors': true,
    }

    let response = await fetch(url, options)
    let data = await response.json()
    let jsonString;
    if (data && data.Data) {
        jsonString = data.Data.replace(/[^ -~]+/g, "");
        return JSON.parse(jsonString.trim())
    }
}

export {
    _add, _get
}