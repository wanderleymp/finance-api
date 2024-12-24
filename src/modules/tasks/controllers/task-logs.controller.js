class TaskLogsController {
    constructor(taskLogsService) {
        this.taskLogsService = taskLogsService;
    }

    async findLogs(req, res, next) {
        try {
            const { 
                task_id,
                start_date,
                end_date,
                level,
                limit,
                offset 
            } = req.query;

            const logs = await this.taskLogsService.findLogs({
                taskId: task_id,
                startDate: start_date ? new Date(start_date) : null,
                endDate: end_date ? new Date(end_date) : null,
                level,
                limit: parseInt(limit) || 100,
                offset: parseInt(offset) || 0
            });

            res.json(logs);
        } catch (error) {
            next(error);
        }
    }

    async findLogById(req, res, next) {
        try {
            const { id } = req.params;
            const log = await this.taskLogsService.findLogById(id);
            res.json(log);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = TaskLogsController;
