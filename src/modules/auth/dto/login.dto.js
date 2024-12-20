/**
 * Data Transfer Object for login request
 */
class LoginDTO {
    constructor(data) {
        this.username = data.username;
        this.password = data.password;
        this.twoFactorToken = data.twoFactorToken;
    }

    validate() {
        if (!this.username || typeof this.username !== 'string') {
            throw new Error('Username is required and must be a string');
        }
        if (!this.password || typeof this.password !== 'string') {
            throw new Error('Password is required and must be a string');
        }
        if (this.twoFactorToken && typeof this.twoFactorToken !== 'string') {
            throw new Error('Two factor token must be a string');
        }
    }
}

/**
 * Data Transfer Object for authentication response
 */
class AuthResponseDTO {
    constructor(data) {
        this.accessToken = data.accessToken;
        this.refreshToken = data.refreshToken;
        this.user = {
            user_id: data.user.user_id,
            username: data.user.username,
            profile_id: data.user.profile_id,
            enable_2fa: data.user.enable_2fa
        };
    }
}

module.exports = {
    LoginDTO,
    AuthResponseDTO
};
