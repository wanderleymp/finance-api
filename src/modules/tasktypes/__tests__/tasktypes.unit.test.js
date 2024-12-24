const TaskTypesService = require("../tasktypes.service");
const TaskTypesRepository = require("../tasktypes.repository");

describe("TaskTypesService", () => {
  let service;
  let repository;

  beforeEach(() => {
    repository = new TaskTypesRepository();
    service = new TaskTypesService(repository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  // TODO: Adicionar testes
});
