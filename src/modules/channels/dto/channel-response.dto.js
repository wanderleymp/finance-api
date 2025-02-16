class ChannelResponseDTO {
    constructor(channel) {
        this.channel_id = channel.channel_id;
        this.channel_name = channel.channel_name;
        this.contact_value = channel.contact_value || null;
        this.is_active = channel.is_active;
        this.department_id = channel.department_id || null;
        this.contact_type = channel.contact_type || 'outros';
        this.created_at = channel.created_at;
        this.updated_at = channel.updated_at;
    }

    toJSON() {
        return {
            channel_id: this.channel_id,
            channel_name: this.channel_name,
            contact_value: this.contact_value,
            is_active: this.is_active,
            department_id: this.department_id,
            contact_type: this.contact_type,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = ChannelResponseDTO;
