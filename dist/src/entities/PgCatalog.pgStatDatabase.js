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
    (0, typeorm_1.Entity)('pg_catalog.pg_stat_database')
], PgCatalog);
pgStatDatabase;
{
    datid: string;
    numbackends: number;
    xact_commit: number;
    xact_rollback: number;
    blks_read: number;
    blks_hit: number;
    tup_returned: number;
    tup_fetched: number;
    tup_inserted: number;
    tup_updated: number;
    tup_deleted: number;
    conflicts: number;
    temp_files: number;
    temp_bytes: number;
    deadlocks: number;
    checksum_failures: number;
    checksum_last_failure: string;
    blk_read_time: string;
    blk_write_time: string;
    session_time: string;
    active_time: string;
    idle_in_transaction_time: string;
    sessions: number;
    sessions_abandoned: number;
    sessions_fatal: number;
    sessions_killed: number;
    stats_reset: string;
    datname: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatDatabase.js.map