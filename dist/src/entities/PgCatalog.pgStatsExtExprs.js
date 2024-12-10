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
    (0, typeorm_1.Entity)('pg_catalog.pg_stats_ext_exprs')
], PgCatalog);
pgStatsExtExprs;
{
    inherited: boolean;
    null_frac: string;
    avg_width: number;
    n_distinct: string;
    most_common_vals: string;
    most_common_freqs: string;
    histogram_bounds: string;
    correlation: string;
    most_common_elems: string;
    most_common_elem_freqs: string;
    elem_count_histogram: string;
    expr: string;
    schemaname: string;
    tablename: string;
    statistics_schemaname: string;
    statistics_name: string;
    statistics_owner: string;
    created_at: Date;
    updated_at: Date;
}
//# sourceMappingURL=PgCatalog.pgStatsExtExprs.js.map