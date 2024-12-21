const BaseRepository = require('../../repositories/base/BaseRepository');

class MovementTypeRepository extends BaseRepository {
    constructor() {
        super('movement_types', 'movement_type_id');
    }
}

module.exports = MovementTypeRepository;
