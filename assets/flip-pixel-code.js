const EVENT_KEY = 'e1d6f251-97fa-4001-8060-b187a38f46e2';
const LS_KEY_WRT = '_alwrt';
const LS_KEY_EVENT_ID = '_aleid';
const LS_KEY_ART = '_alart';
const LS_KEY_SID = '_alsid';

const QUERY_PARAM_EVENT_ID = 'aleid';
const QUERY_PARAM_ART = 'alart';

function generateUUID() {
    if (typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
    } else {
        return generateManualUUID()
    }
}

function generateManualUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, function (c) {
            let r = Math.random() * 16 | 0;
            let v = c == 'x' ? r : (r & 0x3 | 0x8);

            return v.toString(16);
        });
}

function getQueryParameter(param, location) {
    const queryParams = new URLSearchParams(location.search);
    return queryParams.get(param);
}

analytics.subscribe('all_events', async (event) => {
    let localStoreWrt = await browser.localStorage.getItem(LS_KEY_WRT);
    let wrt = localStoreWrt || generateUUID();

    let sessionStoreSid = await browser.sessionStorage.getItem(LS_KEY_SID);
    let sid = sessionStoreSid || generateUUID();

    let localStoreEventId = await browser.localStorage.getItem(LS_KEY_EVENT_ID);
    let queryStringEventId = getQueryParameter(QUERY_PARAM_EVENT_ID, init.context.document.location)
    let eventId = queryStringEventId || localStoreEventId;

    let localStoreArt = await browser.localStorage.getItem(LS_KEY_ART);
    let queryStringArt = getQueryParameter(QUERY_PARAM_ART, init.context.document.location)

    let art = queryStringArt || localStoreArt;

    let payload = {
        applovin: {
            wrt: wrt,
            sid: sid,
            eventId: eventId,
            art: art
        },
        event: event,
        initData: init.data,
    }

    fetch('https://b.applovin.com/shopify/v1/pixel', {
        method: 'POST',
        // mode: 'no-cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-Connect-Event-Key': EVENT_KEY
        },
        keepalive: true,
        body: JSON.stringify(payload),
    });

    await browser.localStorage.setItem(LS_KEY_WRT, wrt); // WRT is always set
    await browser.sessionStorage.setItem(LS_KEY_SID, sid); // SID is always set

    // Update event ID if it was found in the query string
    if (eventId) {
        await browser.localStorage.setItem(LS_KEY_EVENT_ID, eventId);
    }

    // Update ART if it was found in the query string
    if (art) {
        await browser.localStorage.setItem(LS_KEY_ART, art);
    }
});