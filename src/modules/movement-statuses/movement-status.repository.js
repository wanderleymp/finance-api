const BaseRepository = require('../../repositories/base/BaseRepository');

class MovementStatusRepository extends BaseRepository {
    constructor() {
        super('movement_statuses', 'movement_status_id');
    }
}

module.exports = MovementStatusRepository;
