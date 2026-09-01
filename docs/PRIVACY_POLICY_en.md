# Lemon New Tab Privacy Policy

> Last updated: 2026-08-31

This Privacy Policy applies to the pure web page **Lemon New Tab** (the "page") and its related public source code repository.

This page is designed to run in a **local-first** manner. Some online features are **enabled by default or available by default**, including search suggestions and Jinrishici content. Other online features usually require your own action or configuration, such as online wallpapers or some third-party content sources. Regardless of whether such features are enabled, the page does not proactively send your data to the developer's own servers. Based on the current source code, the developer **does not operate a dedicated backend that collects user data from this page**.

Contact email: <lemon@redlnn.top>

## 1. Who We Are

The developer of this page is the maintainer of this project repository. For the page's own functionality, data processing is intentionally kept as much as possible within your browser and device.

For the design, provision, and operation of the page features, the developer acts as a **data controller** or equivalent personal information handler to the extent the developer actually determines the purposes and means of processing under applicable law.

Static hosting providers, third-party APIs, and any online resources you configure yourself may each act as **independent controllers/processors** for their own data practices. Those activities are not directly controlled by the page developer.

## 2. What This Policy Covers

This Policy covers three categories of processing:

1. **Local page processing**: data stored in your browser's local storage (localStorage, sessionStorage), or IndexedDB.
2. **Third-party service requests**: requests sent directly from your browser to external services when you enable online features.
3. **Hosting and distribution**: the page is provided by static hosting operated by the developer or deployed by you; hosting providers may process data when serving content, logging requests, or aggregating statistics.

## 3. What the Page Itself May Process

### 3.1 Data stored locally on your device

The page stores the following data locally on your device:

- page settings and UI preferences, such as theme, layout, search engine configuration, and background settings;
- Quick Links and local state related to frequently visited sites;
- search history, if that local feature is enabled;
- local wallpapers, video wallpapers, cached online wallpapers, and related metadata;
- the sync code and the last sync timestamp (only when you enable sync);
- import/export files for settings (kept by you).

This data is generally stored in your browser environment and is controlled by you or your browser. It is not automatically transmitted to the developer.

### 3.2 Data sent directly to third parties when online

When you use online features that are enabled by default or enabled by you, your browser sends requests directly to third-party services (see Section 6). These requests originate from your browser and do not pass through the developer's servers.

## 4. What We Do Not Do

Except as otherwise described in this Policy, the page developer does **not** proactively collect, sell, rent, or upload the following information to developer-operated servers:

- your identity information, contact details, or payment information;
- your browsing history or search terms;
- the contents of your local images, videos, or files;
- your page settings, Quick Links, wallpaper files, or search history.

## 5. Data That Hosting Providers May Collect

The page is a pure static website that may be hosted by the developer or deployed by you. If you access the page through a third-party hosting service (such as GitHub Pages, Vercel, or Nginx), the hosting provider may independently collect or process:

- IP address, request time, User-Agent, and referring page;
- access logs, download statistics, diagnostics, and usage analytics.

These activities are not directly controlled by the page developer. Please review the relevant platform privacy materials:

- Google: <https://policies.google.com/privacy>
- Microsoft: <https://www.microsoft.com/privacy/privacystatement>
- Mozilla: <https://www.mozilla.org/privacy/>
- GitHub: <https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement>
- Vercel: <https://vercel.com/legal/privacy-policy>

## 6. Third-Party Services and Potential Risks

For online features that are enabled by default, available by default, or manually enabled by you, your browser communicates directly with the following third-party services. In that case, those services can typically receive at least your **IP address, request time, User-Agent, request parameters, and possibly referrer/context information** depending on browser behavior and service configuration. They may also keep logs, apply rate limits, perform fraud prevention, or transfer data across borders under their own rules.

### 6.1 Jinrishici API

- Purpose: fetch Chinese poetry content;
- Endpoint used in the code: `https://v2.jinrishici.com/one.json`
- Default status: **enabled by default / available by default**;
- Risk note: the Jinrishici service may receive and process source IP and other network metadata. Its API responses may also include a token associated with the requester. The developer does not control its logging, routing, retention, or downstream handling.

### 6.2 Hitokoto API

- Purpose: fetch quote / sentence content;
- Endpoint used in the code: `https://v1.hitokoto.cn`
- Risk note: the Hitokoto service may process request metadata for traffic control, statistics, abuse prevention, or operations. Such processing is independently determined by that service.

### 6.3 Search Suggestion APIs

- Google suggestions: `https://suggestqueries.google.com/`
- Baidu suggestions: `https://suggestion.baidu.com/`

Purpose: return suggested search queries while you type.

Risk notes:

- related search suggestion functionality is enabled by default or available by default;
- the search text you type is sent directly to the corresponding provider;
- those providers may log search keywords, IP addresses, browser/device data, and request logs;
- using Google or other global services may involve **cross-border data transfers**.

### 6.4 Online Wallpaper Sources

- Lorem Picsum: `https://picsum.photos`
- Peapix: `https://peapix.com` (image links are served from `img.peapix.com`)

Purpose: fetch online wallpaper images and metadata.

Risk notes:

- your browser sends requests directly to the relevant service for wallpaper metadata and image files;
- those requests may expose your IP address, request time, and browser/device characteristics;
- these services may be located outside your country/region and may involve cross-border transfers; routing, edge nodes, and processing locations may vary by region.

### 6.5 User-Configured Online Wallpaper / Media URLs

- Purpose: allow you to use any image, video, or API endpoint that you choose;
- Risk note: once you configure an online resource URL, your browser sends requests directly to that site. The developer cannot review or control that site's privacy practices, security, legality, logging behavior, cross-border transfers, or downstream uses. Only use providers you trust.

### 6.6 Cloud Settings Sync (optional)

- Purpose: sync page settings, Quick Links, and custom search engines across your devices using a sync code;
- Data storage: uses `Cloudflare KV`, keyed by the SHA-256 hash of your sync code, storing a snapshot of your settings and a sync timestamp;
- Default status: **disabled by default**; only enabled when you actively generate or enter a sync code and perform an upload or download;
- Risk note: once enabled, page settings, Quick Links, and custom search engine content are stored in Cloudflare KV (Cloudflare is an independent data processor whose edge network may be located outside your country/region). **The sync code is the access credential** — anyone who knows it can read or overwrite your cloud settings. Keep it safe. The page itself only stores the sync code locally.

## 7. Purposes of Processing

The page, hosting provider, or third parties may process data for purposes such as:

- providing new tab page functionality;
- storing your local preferences and cache;
- providing search suggestions, wallpapers, poetry, quotes, and site icons;
- maintaining service stability, rate limiting, abuse prevention, security, and troubleshooting.

## 8. Lawful Bases for Processing

Where the GDPR or similar laws apply, the developer relies, within the scope actually controlled by the developer, on the following lawful bases.

### 8.1 Necessity for providing the requested service

Processing necessary for the page's core local functionality, such as saving settings, reading local page state, and rendering the page layout or background you selected, is treated as necessary to provide the functionality you requested.

### 8.2 Consent

For online features that cause your browser to send requests to third parties, especially the **enabled-by-default or available-by-default** search suggestions and Jinrishici content, the page treats those requests as based on your **consent**. You may withdraw that consent by disabling the relevant feature, switching to a non-network alternative, blocking the relevant domains, clearing related cache, or stopping the use of the page.

Requests triggered by online wallpaper URLs, media URLs, third-party API endpoints, or other custom online resources that you configure are also treated as based on your consent.

### 8.3 Legitimate interests

To the extent applicable to the developer or a third-party provider, logging, rate limiting, security protection, troubleshooting, abuse detection, integrity protection, and compatibility improvements may be based on legitimate interests. However, this lawful basis **does not replace consent** where consent is required for default third-party network requests.

### 8.4 Legal obligation

Processing may also occur where necessary to comply with legal obligations, lawful requests, regulatory requirements, or mandatory disclosures.

## 9. Data Retention

### 9.1 Local data

Data stored locally by the page is generally retained until one of the following happens:

- you manually delete it through page settings, browser settings, or developer tools;
- you clear browser site data or local cache;
- the browser removes it under its own storage or sync policies.

### 9.2 Third-party logs and caches

For Jinrishici, Hitokoto, Google, Baidu, and any custom online resources you use, retention periods for logs, caches, and access records are determined by those providers. The developer usually does not know the exact retention period and cannot delete those records on their behalf.

## 10. Cookies and Similar Technologies

The page itself does not set cookies on developer-operated servers and does not use tracking pixels on developer-controlled websites to identify you.

However, **third-party services and hosting platforms** may use cookies, browser cache, Local Storage, IndexedDB, ETags, log identifiers, device identifiers, or similar technologies in scenarios such as:

- search suggestion services identifying sessions, routing regions, rate limiting, or abuse prevention;
- Google, Baidu, or other platforms returning region-specific content based on network environment or prior state;
- Jinrishici or other third-party APIs returning or recording tokens, cache keys, or request identifiers;
- hosting providers or browser vendors supporting access logs, analytics, or security verification.

Those cookies or similar technologies are controlled by the relevant third party, not directly by the page developer. You can usually manage them through browser settings, content blocking rules, site permissions, private browsing, sign-out actions, or by disabling the relevant feature.

## 11. Cross-Border Data Transfers

The developer does not currently operate a dedicated backend that centrally receives your data. However, when you enable third-party online features, your requests may be sent outside your country/region, or may be processed inside one jurisdiction and then further transferred by the provider.

The following scenarios may therefore involve cross-border transfer risks:

- using Google search suggestions;
- using overseas online wallpaper sources such as Lorem Picsum or Peapix;
- using online wallpapers, media, or API endpoints hosted abroad;
- using cloud settings sync (data stored on Cloudflare's global edge network).

Different jurisdictions provide different levels of personal data protection. Transfer mechanisms that may be used by relevant providers can include, without limitation, Standard Contractual Clauses (SCCs), intra-group transfer rules, statutory certification or assessment mechanisms, data localization arrangements, regional traffic routing, or direct cross-border requests initiated on the basis of your consent. Because the developer does not control those third-party infrastructures, the developer cannot guarantee that any particular mechanism applies to every service or every region.

For third-party request features that are enabled by default or available by default, you may stop future cross-border transfers by disabling the relevant feature, blocking the relevant domains, using a non-network alternative, or stopping the use of the page.

## 12. Your Rights

Depending on applicable law, including the GDPR, China's PIPL, and the CCPA/CPRA, you may have rights such as:

- the right to know;
- the right to access;
- the right to correct;
- the right to delete;
- the right to restrict processing;
- the right to object;
- the right to data portability, where applicable and technically feasible;
- the right to withdraw consent for consent-based processing;
- the right to complain to a supervisory authority or regulator.

### 12.1 How to exercise your rights

For processing actually within the developer's control, you may exercise your rights by:

1. sending a request to **lemon@redlnn.top**;
2. using the subject line **Privacy Request**;
3. stating the type of request involved, such as access, correction, deletion, withdrawal of consent, restriction, objection, or complaint, and identifying the relevant browser, page version, and feature module if known;
4. providing only the minimum information needed to locate the issue, and not sending unnecessary sensitive information;
5. contacting the relevant hosting provider or third-party provider directly where the requested data is controlled by them rather than by the developer.

The developer will make reasonable efforts to respond within the period required by applicable law. If the developer cannot verify the request, cannot access the relevant data, or the data is entirely controlled by a third party, the developer will explain that limitation.

### 12.2 For this page specifically

For this page specifically:

- because the developer generally **does not hold a server-side copy of your page content**, practical control over most data remains with you, your browser vendor, or the relevant third-party service;
- you can exercise much of your control by clearing browser site data, disabling online features, deleting local wallpapers and search history;
- if you have questions about matters within the developer's controllable scope, contact <lemon@redlnn.top>.

## 13. Children

This page is not specifically directed to children. If you are considered a minor under the law of your jurisdiction, use online features only under guidance from a parent or guardian.

If you believe a third-party service has processed a child's personal information without proper authorization, please contact that third-party provider directly. You may also contact the developer for matters within the developer's actual control.

## 14. Compliance Statement

This Privacy Policy is intended to describe, in a clear and understandable manner, the boundaries of data collection, storage, transfer, and processing relevant to this page in light of **the GDPR, the Personal Information Protection Law of the People's Republic of China (PIPL), and U.S. state privacy laws such as the California CCPA/CPRA**.

Because this page relies on browser platforms and third-party services, the exact legal obligations, processing locations, and retention periods may vary depending on your location, the hosting provider's policies, the third-party provider's infrastructure, and future product changes.

References in this Policy to concepts such as "consent", "legitimate interests", and "data controller / processor" should be interpreted within the limits of applicable law and actual factual control. If mandatory law requires a different result, the applicable law will prevail.

## 15. Recommended Third-Party Policies

You should also review the following third-party privacy materials:

- Google Privacy Policy: <https://policies.google.com/privacy>
- Microsoft Privacy Statement: <https://www.microsoft.com/privacy/privacystatement>
- Mozilla Privacy Policy: <https://www.mozilla.org/privacy/>
- Baidu Privacy Platform: <https://privacy.baidu.com/policy>
- Jinrishici documentation: <https://www.jinrishici.com/doc/>
- Hitokoto Developer Center: <https://developer.hitokoto.cn/>

If a third-party service does not publish a complete privacy policy, you should assume that enabling that service may still expose basic network metadata to that provider and evaluate the related risks yourself.

## 16. Updates to This Policy

If the page's features, dependencies, or legal requirements change, the developer may update this Privacy Policy. Updated versions may be published in the project repository or release channels.