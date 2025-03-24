import { chromium } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import fetch from 'node-fetch';
import { decode } from 'html-entities';
import { PreviewData } from 'group-api-client';

import {
    isImageUrl,
    getDomainFromUrl,
    getOEmbedEndpoint,
} from './linkPreviewUtils';

chromium.use(StealthPlugin());

export async function fetchLinkPreview(url: string): Promise<PreviewData> {
    // 1. Check if the URL is an image.
    if (await isImageUrl(url)) {
        return {
            title: url,
            description: '',
            images: [url],
            siteName: getDomainFromUrl(url),
            url,
        };
    }

    // 2. Try oEmbed/Open Graph data.
    const oEmbedEndpoint = getOEmbedEndpoint(url);
    if (oEmbedEndpoint) {
        try {
            const response = await fetch(oEmbedEndpoint);
            if (!response.ok) {
                throw new Error(
                    `oEmbed request failed with status: ${response.status}`
                );
            }
            const oEmbedData = await response.json();
            return {
                title: decode(oEmbedData.title || url),
                description: decode(
                    oEmbedData.author_name || oEmbedData.description || ''
                ),
                images: oEmbedData.thumbnail_url
                    ? [decode(oEmbedData.thumbnail_url)]
                    : [],
                siteName: getDomainFromUrl(url),
                url,
                locale: decode(oEmbedData.locale || ''),
                ogType: decode(oEmbedData.type || ''),
                logo: '',
                embedHtml: oEmbedData.html,
            };
        } catch (error) {
            console.warn('oEmbed fetch failed:', error);
        }
    }

    // 3. Reddit JSON Fallback.
    if (url.includes('reddit.com')) {
        try {
            const redditUrl = url.endsWith('/')
                ? `${url}.json`
                : `${url}/.json`;
            const redditResponse = await fetch(redditUrl);
            if (redditResponse.ok) {
                const redditData = await redditResponse.json();
                const postData = redditData[0]?.data?.children[0]?.data;
                if (postData) {
                    let images: string[] = [];
                    if (
                        postData.preview?.images &&
                        postData.preview.images.length > 0
                    ) {
                        const imageSource = postData.preview.images[0].source;
                        if (imageSource && imageSource.url) {
                            const decodedUrl = decode(imageSource.url);
                            images = [decodedUrl];
                        }
                    }
                    return {
                        title: postData.title || url,
                        description: postData.selftext || '',
                        images,
                        siteName: getDomainFromUrl(url),
                        url,
                    };
                }
            }
        } catch (error) {
            console.warn('Reddit JSON fetch failed:', error);
        }
    }

    // 4. Fallback: Open Graph scraping from raw HTML using Playwright.
    try {
        const browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-blink-features=AutomationControlled',
            ],
            slowMo: 50,
            timeout: 120_000,
        });
        const context = await browser.newContext({
            userAgent:
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
        });
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 60_000 });
        const html = await page.content();
        await browser.close();

        const ogTitleMatch = html.match(
            /<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i
        );
        const ogDescriptionMatch = html.match(
            /<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i
        );
        const ogImageMatch = html.match(
            /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
        );
        const metaDescriptionMatch = html.match(
            /<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i
        );

        let imgMatch;
        let descriptionFallback: string | undefined;
        if (url.includes('wikipedia.org')) {
            const contentMatch = html.match(
                /<div[^>]+id=["']mw-content-text["'][^>]*>([\S\s]*)<\/div>/i
            );
            const contentHtml = contentMatch ? contentMatch[1] : html;
            imgMatch = contentHtml.match(/<img[^>]+src=["']([^"']+)["']/i);
            const paragraphRegex = /<p\b[^>]*>([\S\s]*?)<\/p>/gi;
            const paragraphs: string[] = [];
            let match;
            while (
                (match = paragraphRegex.exec(contentHtml)) !== null &&
                paragraphs.length === 0
            ) {
                const paragraphText = decode(
                    match[1].replace(/<[^>]+>/g, '').trim()
                );
                if (paragraphText) {
                    paragraphs.push(paragraphText);
                }
            }
            descriptionFallback = paragraphs[0] ? `${paragraphs[0]}...` : '';
        } else {
            imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
        }
        const firstImageUrl = imgMatch
            ? new URL(imgMatch[1], url).toString()
            : undefined;
        const titleFallbackMatch = html.match(/<title>(.*?)<\/title>/i);

        return {
            title: decode(
                ogTitleMatch
                    ? ogTitleMatch[1]
                    : titleFallbackMatch
                      ? titleFallbackMatch[1]
                      : url
            ),
            description: decode(
                ogDescriptionMatch
                    ? ogDescriptionMatch[1]
                    : metaDescriptionMatch
                      ? metaDescriptionMatch[1]
                      : descriptionFallback || ''
            ),
            images: ogImageMatch
                ? [decode(ogImageMatch[1])]
                : firstImageUrl
                  ? [decode(firstImageUrl)]
                  : [],
            siteName: getDomainFromUrl(url),
            url,
        };
    } catch (error) {
        console.error('Manual link preview error:', error);
        return {
            title: url,
            description: '',
            images: [],
            siteName: getDomainFromUrl(url),
            url,
        };
    }
}
