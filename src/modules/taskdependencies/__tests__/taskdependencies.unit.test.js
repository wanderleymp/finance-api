const TaskDependenciesService = require("../taskdependencies.service");
const TaskDependenciesRepository = require("../taskdependencies.repository");

describe("TaskDependenciesService", () => {
  let service;
  let repository;

  beforeEach(() => {
    repository = new TaskDependenciesRepository();
    service = new TaskDependenciesService(repository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // TODO: Adicionar testes
});
