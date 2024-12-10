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
exports.PersonDetailsView = void 0;
const typeorm_1 = require("typeorm");
let PersonDetailsView = class PersonDetailsView {
    person_id;
    birth_date;
    social_capital;
    created_at;
    contacts;
    documents;
    ibge;
    full_name;
    fantasy_name;
    street;
    number;
    complement;
    neighborhood;
    city;
    state;
    postal_code;
    country;
    reference;
    created_at;
    updated_at;
};
exports.PersonDetailsView = PersonDetailsView;
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PersonDetailsView.prototype, "person_id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Date)
], PersonDetailsView.prototype, "birth_date", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "social_capital", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], PersonDetailsView.prototype, "contacts", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Object)
], PersonDetailsView.prototype, "documents", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], PersonDetailsView.prototype, "ibge", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "full_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 255 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "fantasy_name", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "street", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "number", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "complement", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "neighborhood", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "city", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 2 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "state", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 10 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "postal_code", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "country", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100 }),
    __metadata("design:type", String)
], PersonDetailsView.prototype, "reference", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], PersonDetailsView.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], PersonDetailsView.prototype, "updated_at", void 0);
exports.PersonDetailsView = PersonDetailsView = __decorate([
    (0, typeorm_1.Entity)('person_details_view')
], PersonDetailsView);
//# sourceMappingURL=PersonDetailsView.js.map