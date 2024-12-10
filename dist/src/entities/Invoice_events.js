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
exports.InvoiceEvents = void 0;
const typeorm_1 = require("typeorm");
let InvoiceEvents = class InvoiceEvents {
    event_id;
    invoice_id;
    event_type;
    event_date;
    event_data;
    status;
    message;
    created_at;
    updatedAt;
};
exports.InvoiceEvents = InvoiceEvents;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)({ default: 'nextval(invoice_events_event_id_seq)' }),
    __metadata("design:type", Number)
], InvoiceEvents.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], InvoiceEvents.prototype, "invoice_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 50 }),
    __metadata("design:type", String)
], InvoiceEvents.prototype, "event_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], InvoiceEvents.prototype, "event_date", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", Object)
], InvoiceEvents.prototype, "event_data", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, length: 20 }),
    __metadata("design:type", String)
], InvoiceEvents.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true }),
    __metadata("design:type", String)
], InvoiceEvents.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.Column)({ nullable: true, default: new Date() }),
    __metadata("design:type", Date)
], InvoiceEvents.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], InvoiceEvents.prototype, "updatedAt", void 0);
exports.InvoiceEvents = InvoiceEvents = __decorate([
    (0, typeorm_1.Entity)('invoice_events')
], InvoiceEvents);
//# sourceMappingURL=Invoice_events.js.map