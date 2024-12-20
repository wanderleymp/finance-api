/**
 * Interface for Authentication Service
 */
class IAuthService {
    /**
     * Authenticate user and generate tokens
     * @param {string} username - User's username
     * @param {string} password - User's password
     * @param {string} [twoFactorToken] - Optional 2FA token
     * @returns {Promise<Object>} Authentication result with tokens
     */
    async login(username, password, twoFactorToken) {}

    /**
     * Refresh access token using refresh token
     * @param {string} refreshToken - Current refresh token
     * @returns {Promise<Object>} New tokens
     */
    async refreshToken(refreshToken) {}

    /**
     * Validate access token
     * @param {string} token - Access token to validate
     * @returns {Promise<Object>} Decoded token payload
     */
    async validateToken(token) {}

    /**
     * Logout user and invalidate tokens
     * @param {string} refreshToken - Refresh token to invalidate
     * @returns {Promise<void>}
     */
    async logout(refreshToken) {}
}

module.exports = IAuthService;
