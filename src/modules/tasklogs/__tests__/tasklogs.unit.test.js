const TaskLogsService = require("../tasklogs.service");
const TaskLogsRepository = require("../tasklogs.repository");

describe("TaskLogsService", () => {
  let service;
  let repository;

  beforeEach(() => {
    repository = new TaskLogsRepository();
    service = new TaskLogsService(repository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // TODO: Adicionar testes
});
