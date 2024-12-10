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
exports.N8nFluxo = void 0;
const typeorm_1 = require("typeorm");
let N8nFluxo = class N8nFluxo {
    id;
    created_at;
    message;
    convid;
    created_at;
    updated_at;
};
exports.N8nFluxo = N8nFluxo;
__decorate([
    (0, typeorm_1.Column)({ nullable: false, primary: true }),
    __metadata("design:type", Number)
], N8nFluxo.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], N8nFluxo.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], N8nFluxo.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], N8nFluxo.prototype, "convid", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], N8nFluxo.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], N8nFluxo.prototype, "updated_at", void 0);
exports.N8nFluxo = N8nFluxo = __decorate([
    (0, typeorm_1.Entity)('n8n_fluxo')
], N8nFluxo);
//# sourceMappingURL=N8nFluxo.js.map