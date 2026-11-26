import { env } from '../config/env.js';

// Convert the stored image path into a full URL for the frontend.
export function getProductImageUrl(imagePath) {
    return new URL(imagePath, env.PUBLIC_BASE_URL).href;
}