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
    (0, typeorm_1.Entity)('pg_catalog.pg_stat_all_tables')
], PgCatalog);
pgStatAllTables;
{
    relid: string;
    seq_scan: number;
    last_seq_scan: string;
    seq_tup_read: number;
    idx_scan: number;
    last_idx_scan: string;
    idx_tup_fetch: number;
    n_tup_ins: number;
    n_tup_upd: number;
    n_tup_del: number;
    n_tup_hot_upd: number;
    n_tup_newpage_upd: number;
    n_live_tup: number;
    n_dead_tup: number;
    n_mod_since_analyze: number;
    n_ins_since_vacuum: number;
    last_vacuum: string;
    last_autovacuum: string;
    last_analyze: string;
    last_autoanalyze: string;
    vacuum_count: number;
    autovacuum_count: number;
    analyze_count: number;
    autoanalyze_count: number;
    schemaname: string;
    relname: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatAllTables.js.map