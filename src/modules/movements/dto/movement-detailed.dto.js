class MovementDetailedDTO {
    static fromDatabase(data) {
        console.log('MovementDetailedDTO.fromDatabase - Dados recebidos:', {
            dataKeys: Object.keys(data),
            licenseType: typeof data.license,
            personType: typeof data.person,
            itemsType: typeof data.items
        });

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
            license: data.license || null,
            person: data.person || null,
            items: data.items || []
        };
    }
}

module.exports = MovementDetailedDTO;
