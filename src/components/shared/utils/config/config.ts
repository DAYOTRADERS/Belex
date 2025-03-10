// Import necessary utilities and helpers
import { LocalStorageConstants, LocalStorageUtils, URLUtils } from '@deriv-com/utils';
import { isStaging } from '../url/helpers';

// Define application IDs for different environments
export const APP_IDS = {
    LOCALHOST: 68411, // Updated to 68411
    TMP_STAGING: 64584,
    STAGING: 29934,
    STAGING_BE: 29934,
    STAGING_ME: 29934,
    PRODUCTION: 65555, // Replace with your actual production app ID
    PRODUCTION_BE: 65556,
    PRODUCTION_ME: 65557,
};

// LiveChat configuration
export const livechat_license_id = 12049137;
export const livechat_client_id = '66aa088aad5a414484c1fd1fa8a5ace7';

// Mapping of domains to application IDs
export const domain_app_ids = {
    'master.bot-standalone.pages.dev': APP_IDS.TMP_STAGING,
    'staging-dbot.deriv.com': APP_IDS.STAGING,
    'staging-dbot.deriv.be': APP_IDS.STAGING_BE,
    'staging-dbot.deriv.me': APP_IDS.STAGING_ME,
    'dbot.deriv.com': APP_IDS.PRODUCTION,
    'dbot.deriv.be': APP_IDS.PRODUCTION_BE,
    'dbot.deriv.me': APP_IDS.PRODUCTION_ME,
};

// Function to get the current production domain
export const getCurrentProductionDomain = () =>
    !/^staging\./.test(window.location.hostname) &&
    Object.keys(domain_app_ids).find(domain => window.location.hostname === domain);

// Function to check if the environment is production
export const isProduction = () => {
    const all_domains = Object.keys(domain_app_ids).map(domain => `(www\.)?${domain.replace('.', '\.')}`);
    return new RegExp(`^(${all_domains.join('|')})$`, 'i').test(window.location.hostname);
};

// Function to check if the environment is a test link
export const isTestLink = () => {
    return (
        window.location.origin?.includes('.binary.sx') ||
        window.location.origin?.includes('bot-65f.pages.dev') ||
        isLocal()
    );
};

// Function to check if the environment is local
export const isLocal = () => /localhost(:\d+)?$/i.test(window.location.hostname);

// Function to get the default server URL
const getDefaultServerURL = () => {
    if (isTestLink()) {
        return 'ws.derivws.com';
    }

    let active_loginid_from_url;
    const search = window.location.search;
    if (search) {
        const params = new URLSearchParams(document.location.search.substring(1));
        active_loginid_from_url = params.get('acct1');
    }

    const loginid = window.localStorage.getItem('active_loginid') ?? active_loginid_from_url;
    const is_real = loginid && !/^(VRT|VRW)/.test(loginid);

    const server = is_real ? 'green' : 'blue';
    const server_url = `${server}.derivws.com`;

    return server_url;
};

// Function to get the default app ID and server URL
export const getDefaultAppIdAndUrl = () => {
    const server_url = getDefaultServerURL();

    if (isTestLink()) {
        return { app_id: APP_IDS.LOCALHOST, server_url };
    }

    const current_domain = getCurrentProductionDomain() ?? '';
    const app_id = domain_app_ids[current_domain as keyof typeof domain_app_ids] ?? APP_IDS.PRODUCTION;

    return { app_id, server_url };
};

// Function to get the application ID
export const getAppId = () => {
    let app_id = null;
    const config_app_id = window.localStorage.getItem('config.app_id');
    const current_domain = getCurrentProductionDomain() ?? '';

    if (config_app_id) {
        app_id = config_app_id;
    } else if (isStaging()) {
        app_id = APP_IDS.STAGING;
    } else if (isTestLink()) {
        app_id = APP_IDS.LOCALHOST;
    } else {
        app_id = domain_app_ids[current_domain as keyof typeof domain_app_ids] ?? APP_IDS.PRODUCTION;
    }

    return app_id;
};

// Function to get the WebSocket URL
export const getSocketURL = () => {
    const local_storage_server_url = window.localStorage.getItem('config.server_url');
    if (local_storage_server_url) return local_storage_server_url;

    const server_url = getDefaultServerURL();

    return server_url;
};

// Function to check and set endpoint from URL parameters
export const checkAndSetEndpointFromUrl = () => {
    if (isTestLink()) {
        const url_params = new URLSearchParams(location.search.slice(1));

        if (url_params.has('qa_server') && url_params.has('app_id')) {
            const qa_server = url_params.get('qa_server') || '';
            const app_id = url_params.get('app_id') || '';

            url_params.delete('qa_server');
            url_params.delete('app_id');

            if (/^(^(www\.)?qa[0-9]{1,4}\.deriv\.dev|(.*)\.derivws\.com)$/.test(qa_server) && /^[0-9]+$/.test(app_id)) {
                localStorage.setItem('config.app_id', app_id);
                localStorage.setItem('config.server_url', qa_server.replace(/"/g, ''));
            }

            const params = url_params.toString();
            const hash = location.hash;

            location.href = `${location.protocol}//${location.hostname}${location.pathname}${
                params ? `?${params}` : ''
            }${hash || ''}`;

            return true;
        }
    }

    return false;
};

// Function to get the debug service worker flag
export const getDebugServiceWorker = () => {
    const debug_service_worker_flag = window.localStorage.getItem('debug_service_worker');
    if (debug_service_worker_flag) return !!parseInt(debug_service_worker_flag);

    return false;
};

// Function to generate the OAuth URL
export const generateOAuthURL = () => {
    const { getOauthURL } = URLUtils;
    const oauth_url = getOauthURL();
    const original_url = new URL(oauth_url);
    const configured_server_url = (LocalStorageUtils.getValue(LocalStorageConstants.configServerURL) ||
        localStorage.getItem('config.server_url') ||
        original_url.hostname) as string;

    const valid_server_urls = ['green.derivws.com', 'red.derivws.com', 'blue.derivws.com'];
    if (!valid_server_urls.includes(configured_server_url)) {
        original_url.hostname = configured_server_url;
    }
    return original_url.toString() || oauth_url;
};
