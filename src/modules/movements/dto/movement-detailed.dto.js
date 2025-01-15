class MovementDetailedDTO {
    static fromDatabase(data) {
        return {
            movement: {
                movement_id: data.movement_id,
                // Adicionar todos os campos de movimento
                ...Object.fromEntries(
                    Object.keys(data)
                        .filter(key => !['license', 'person', 'items'].includes(key))
                        .map(key => [key, data[key]])
                )
            },
            license: data.license ? JSON.parse(data.license) : null,
            person: data.person ? JSON.parse(data.person) : null,
            items: data.items ? JSON.parse(data.items) : []
        };
    }
}

module.exports = MovementDetailedDTO;
