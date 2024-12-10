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
    (0, typeorm_1.Entity)('pg_catalog.pg_stat_activity')
], PgCatalog);
pgStatActivity;
{
    datid: string;
    pid: number;
    leader_pid: number;
    usesysid: string;
    client_addr: string;
    client_port: number;
    backend_start: string;
    xact_start: string;
    query_start: string;
    state_change: string;
    backend_xid: string;
    backend_xmin: string;
    query_id: number;
    application_name: string;
    client_hostname: string;
    wait_event_type: string;
    wait_event: string;
    state: string;
    query: string;
    backend_type: string;
    datname: string;
    usename: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatActivity.js.map