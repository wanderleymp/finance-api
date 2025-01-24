class Logger {
    info(message, metadata = {}) {
        console.log(JSON.stringify({
            level: 'info',
            message,
            ...metadata,
            timestamp: new Date().toISOString()
        }));
    }

    error(message, metadata = {}) {
        console.error(JSON.stringify({
            level: 'error',
            message,
            ...metadata,
            timestamp: new Date().toISOString()
        }));
    }

    warn(message, metadata = {}) {
        console.warn(JSON.stringify({
            level: 'warn',
            message,
            ...metadata,
            timestamp: new Date().toISOString()
        }));
    }
}

module.exports = new Logger();
