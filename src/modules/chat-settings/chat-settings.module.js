const ChatSettingsController = require('./chat-settings.controller');
const chatSettingsRoutes = require('./chat-settings.routes');

class ChatSettingsModule {
    static register(app) {
        const controller = new ChatSettingsController();
        app.use('/chat-settings', chatSettingsRoutes(controller));
    }
}

module.exports = ChatSettingsModule;
