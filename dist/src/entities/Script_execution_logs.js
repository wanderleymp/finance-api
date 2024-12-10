"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScriptExecutionLogs = void 0;
const typeorm_1 = require("typeorm");
let ScriptExecutionLogs = class ScriptExecutionLogs {
    log_id;
    script_id;
    script_content;
    executed_at;
    status;
    error_message;
    createdAt;
    updatedAt;
};
exports.ScriptExecutionLogs = ScriptExecutionLogs;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(model.script_execution_logs_log_id_seq)' }),
    __metadata("design:type", Number)
], ScriptExecutionLogs.prototype, "log_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ nullable: true }),
    __metadata("design:type", Number)
], ScriptExecutionLogs.prototype, "script_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ScriptExecutionLogs.prototype, "script_content", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], ScriptExecutionLogs.prototype, "executed_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 50 }),
    __metadata("design:type", String)
], ScriptExecutionLogs.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], ScriptExecutionLogs.prototype, "error_message", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ScriptExecutionLogs.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ScriptExecutionLogs.prototype, "updatedAt", void 0);
exports.ScriptExecutionLogs = ScriptExecutionLogs = __decorate([
    (0, typeorm_1.Entity)('script_execution_logs')
], ScriptExecutionLogs);
//# sourceMappingURL=Script_execution_logs.js.map