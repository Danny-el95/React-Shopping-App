import axios from 'axios';

export function getAuthError(error) {
    if (!axios.isAxiosError(error)) {
        return 'Something went wrong. Please try again.';
    }

    // The request exceeded the configured timeout.
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        return 'The request took too long. Please try again.';
    }

    // A request was sent, but no readable response arrived.
    if (!error.response) {
        return error.request
            ? 'Unable to reach the server. Check your connection and try again.'
            : 'Unable to send the request. Please try again.';
    }

    const { status, data } = error.response;

    switch (status) {
        case 400:
            return data?.error || data?.message || 'Please check your details.';

        case 401:
            return 'Incorrect email or password. Please try again.';

        case 409:
            return 'That username or email is already registered.';

        case 429:
            return 'Too many attempts. Please wait before trying again.';

        default:
            if (status >= 500) {
                return 'The server is having trouble. Please try again later.';
            }

            return 'The request failed. Please try again.';
    }
}
