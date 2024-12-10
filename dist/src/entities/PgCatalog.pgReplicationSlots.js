"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PgCatalog = void 0;
const typeorm_1 = require("typeorm");
let PgCatalog = class PgCatalog {
};
exports.PgCatalog = PgCatalog;
exports.PgCatalog = PgCatalog = __decorate([
    (0, typeorm_1.Entity)('pg_catalog.pg_replication_slots')
], PgCatalog);
pgReplicationSlots;
{
    datoid: string;
    temporary: boolean;
    active: boolean;
    active_pid: number;
    xmin: string;
    catalog_xmin: string;
    restart_lsn: string;
    confirmed_flush_lsn: string;
    safe_wal_size: number;
    two_phase: boolean;
    conflicting: boolean;
    slot_type: string;
    wal_status: string;
    slot_name: string;
    plugin: string;
    database: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgReplicationSlots.js.map