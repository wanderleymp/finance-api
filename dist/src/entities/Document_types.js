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
exports.DocumentTypes = void 0;
const typeorm_1 = require("typeorm");
let DocumentTypes = class DocumentTypes {
    document_type_id;
    description;
    createdAt;
    updatedAt;
};
exports.DocumentTypes = DocumentTypes;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(document_types_document_type_id_seq)' }),
    __metadata("design:type", Number)
], DocumentTypes.prototype, "document_type_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], DocumentTypes.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], DocumentTypes.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], DocumentTypes.prototype, "updatedAt", void 0);
exports.DocumentTypes = DocumentTypes = __decorate([
    (0, typeorm_1.Entity)('document_types')
], DocumentTypes);
//# sourceMappingURL=Document_types.js.map