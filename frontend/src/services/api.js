import { API_BASE } from '../constants/config';

/**
 * Fetches video metadata and available formats from the backend.
 * @param {string} url - The video URL to analyze.
 * @param {string} cookies - Optional cookies string.
 * @returns {Promise<object>} Video info object with title, thumbnail, duration, formats.
 */
export const fetchVideoInfo = async (url, cookies = '') => {
    const response = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, cookies }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch video info');
    return data;
};

/**
 * Sends a download request and returns the raw Response for streaming.
 * @param {string} url        - The video URL.
 * @param {string} format_id  - The selected format ID.
 * @param {string} cookies    - Optional cookies string.
 * @returns {Promise<Response>} Raw fetch Response containing the file blob.
 */
export const downloadVideo = async (url, format_id, cookies = '') => {
    const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format_id, cookies }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Download failed on server.');
    }

    return response;
};
