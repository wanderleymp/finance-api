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
    (0, typeorm_1.Entity)('pg_catalog.pg_stat_wal_receiver')
], PgCatalog);
pgStatWalReceiver;
{
    pid: number;
    receive_start_lsn: string;
    receive_start_tli: number;
    written_lsn: string;
    flushed_lsn: string;
    received_tli: number;
    last_msg_send_time: string;
    last_msg_receipt_time: string;
    latest_end_lsn: string;
    latest_end_time: string;
    sender_port: number;
    status: string;
    slot_name: string;
    sender_host: string;
    conninfo: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatWalReceiver.js.map