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
exports.TaskLogs = void 0;
const typeorm_1 = require("typeorm");
let TaskLogs = class TaskLogs {
    log_id;
    task_id;
    status_id;
    message;
    created_at;
    updatedAt;
};
exports.TaskLogs = TaskLogs;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(task_logs_log_id_seq)' }),
    __metadata("design:type", Number)
], TaskLogs.prototype, "log_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TaskLogs.prototype, "task_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], TaskLogs.prototype, "status_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], TaskLogs.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], TaskLogs.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], TaskLogs.prototype, "updatedAt", void 0);
exports.TaskLogs = TaskLogs = __decorate([
    (0, typeorm_1.Entity)('task_logs')
], TaskLogs);
//# sourceMappingURL=Task_logs.js.map