chrome.webNavigation.onBeforeNavigate.addListener(function (details) {
    chrome.storage.sync.get("aliases", (result) => {
        const browserUrl = decodeURIComponent(details.url);
        const aliases = result.aliases || {};
        logNavigationDetails(browserUrl, aliases);

        const { aliasKey, params } = matchStrategy(browserUrl, aliases);
        if (aliasKey) {
            const url = mapAliseToUrl(aliasKey, aliases, params);
            logAliasMatch(aliasKey, url);
            if (url) {
                chrome.tabs.update(details.tabId, { url }); // Redirect to the alias URL
            }
        }
    });
});

function matchStrategy(url: string, aliases: { [key: string]: { value: string, sort: number } }): { aliasKey: string, params: Object } {
    for (const browserItem in browsersStrategy) {
        const strategy = browsersStrategy[browserItem];
        if (strategy.match(url)) {
            const inputValue = strategy.getSearchQuery(url);
            if (inputValue) {
                let inputKey = getPath(inputValue);
                let aliasKey = Object.keys(aliases).find((key) => {
                    return key === inputKey;
                });
                if (aliasKey) {
                    let params = getQuery(inputValue);
                    return {
                        aliasKey,
                        params: params || {}
                    };
                }
            }
            break; // Break after the first matching strategy
        }
    }
    return {
        aliasKey: "",
        params: {}
    }; // Return empty if no match is found
}

function mapAliseToUrl(aliasKey: string, aliases: { [key: string]: { value: string, sort: number } }, params: Object): string {
    let url = aliases[aliasKey]?.value || "";
    // 如果params为空，则也删除掉url中的参数
    if (Object.keys(params).length === 0) {
        return getPath(url);
    }

    for (const param in params) {
        url = url.replace(`{${param}}`, params[param]); // Replace placeholders with actual values
    }
    return url;
}

function logNavigationDetails(url: string, aliases: { [key: string]: { value: string, sort: number } }): void {
    console.log("Navigating to:", url);
    console.log("Aliases loaded from storage:", aliases);
}

function logAliasMatch(aliasKey: string, url: string): void {
    console.log("Alias matched:", aliasKey);
    console.log("Redirecting to:", url);
}

const browsersStrategy = {
    'chrome': {
        'match': function (url: string): boolean {
            const googleSearchPattern = /^https:\/\/www\.google\.com\/search\?q=/;
            return googleSearchPattern.test(url); // Check if the URL matches the Google search pattern
        },
        'getSearchQuery': function (url: string): string | null {
            const googleSearchPattern = /^https:\/\/www\.google\.com\/search\?q=([^&]+)/;
            const match = url.match(googleSearchPattern);
            return match ? match[1] : null; // Extract and return the 'q' parameter, or null if not found
        }
    }
};

function getPath (url: string): string {
    const path = url.split("?")[0];
    return path;
}

function getQuery (url: string): Object {
    const queryString = url.split("?")[1];
    const query = {};
    if (queryString) {
        const params = queryString.split("&");
        for (const param of params) {
            const [key, value] = param.split("=");
            query[key] = decodeURIComponent(value);
        }
    }
    return query;
}
