import { API_BASE } from '../constants/config';

/**
 * Fetches video metadata and available formats from the backend.
 * @param {string} url - The video URL to analyze.
 * @returns {Promise<object>} Video info object with title, thumbnail, duration, formats.
 */
export const fetchVideoInfo = async (url) => {
    const response = await fetch(`${API_BASE}/info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || 'Failed to fetch video info');
    return data;
};

/**
 * Sends a download request and returns the raw Response for streaming.
 * @param {string} url        - The video URL.
 * @param {string} format_id  - The selected format ID.
 * @returns {Promise<Response>} Raw fetch Response containing the file blob.
 */
export const downloadVideo = async (url, format_id) => {
    const response = await fetch(`${API_BASE}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format_id }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Download failed on server.');
    }

    return response;
};
