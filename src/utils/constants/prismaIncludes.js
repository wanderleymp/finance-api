const MOVEMENT_INCLUDES = {
    persons: {
        select: {
            person_id: true,
            full_name: true,
            fantasy_name: true,
            person_documents: {
                select: {
                    document_number: true,
                    document_types: {
                        select: {
                            description: true
                        }
                    }
                }
            }
        }
    },
    movement_types: {
        select: {
            movement_type_id: true,
            type_name: true
        }
    },
    movement_statuses: {
        select: {
            movement_status_id: true,
            status_name: true,
            description: true
        }
    }
};

module.exports = {
    MOVEMENT_INCLUDES
};
