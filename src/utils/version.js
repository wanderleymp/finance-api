/**
 * Compares version strings to check compatibility
 * @param {string} currentVersion - Current version of the system
 * @param {string} requiredVersion - Required version to compare against
 * @returns {boolean} - True if versions are compatible
 */
function isCompatibleVersion(currentVersion, requiredVersion) {
    if (!currentVersion || !requiredVersion) {
        return false;
    }

    const current = currentVersion.split('.').map(Number);
    const required = requiredVersion.split('.').map(Number);

    // Compare major version
    if (current[0] !== required[0]) {
        return false;
    }

    // Compare minor version
    if (current[1] < required[1]) {
        return false;
    }

    return true;
}

module.exports = {
    isCompatibleVersion
};
