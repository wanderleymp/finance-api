"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __setFunctionName = (this && this.__setFunctionName) || function (f, name, prefix) {
    if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
    return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileStorageDomainService = void 0;
var common_1 = require("@nestjs/common");
var FileStorageDomainService = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var FileStorageDomainService = _classThis = /** @class */ (function () {
        function FileStorageDomainService_1(fileStorageAdapter, loggerService, metricsService) {
            this.fileStorageAdapter = fileStorageAdapter;
            this.loggerService = loggerService;
            this.metricsService = metricsService;
        }
        FileStorageDomainService_1.prototype.uploadFile = function (file_1, metadata_1) {
            return __awaiter(this, arguments, void 0, function (file, metadata, maxSizeInMB) {
                var startTime, defaultBucketName, finalMetadata, fileId, error_1;
                if (maxSizeInMB === void 0) { maxSizeInMB = 10; }
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            startTime = Date.now();
                            console.log('Iniciando upload de arquivo', { metadata: metadata, fileSize: file.length });
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            // Validações de negócio
                            this.validateFileSize(metadata.size, maxSizeInMB);
                            this.validateFileType(metadata.contentType);
                            defaultBucketName = 'finance';
                            finalMetadata = __assign(__assign({}, metadata), { bucketName: metadata.bucketName || defaultBucketName });
                            console.log('Metadados finais', { finalMetadata: finalMetadata });
                            return [4 /*yield*/, this.fileStorageAdapter.uploadFile(file, finalMetadata)];
                        case 2:
                            fileId = _a.sent();
                            console.log('Upload concluído', { fileId: fileId });
                            // Log e métricas
                            this.loggerService.logFileUpload(finalMetadata, fileId);
                            this.metricsService.recordUpload(finalMetadata.contentType, finalMetadata.size);
                            this.loggerService.logPerformance('uploadFile', startTime);
                            return [2 /*return*/, fileId];
                        case 3:
                            error_1 = _a.sent();
                            console.error('Erro no upload de arquivo', error_1);
                            this.loggerService.logError('uploadFile', error_1);
                            this.metricsService.recordError(error_1.constructor.name);
                            throw error_1;
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        FileStorageDomainService_1.prototype.validateFileSize = function (fileSize, maxSizeInMB) {
            var maxSizeInBytes = maxSizeInMB * 1024 * 1024;
            if (fileSize > maxSizeInBytes) {
                throw new Error('Arquivo excede o tamanho máximo');
            }
        };
        FileStorageDomainService_1.prototype.validateFileType = function (contentType) {
            var allowedTypes = [
                'text/plain',
                'application/pdf',
                'image/jpeg',
                'image/png',
                'application/json',
                'text/csv'
            ];
            if (!allowedTypes.includes(contentType)) {
                throw new Error('Tipo de arquivo não permitido');
            }
        };
        FileStorageDomainService_1.prototype.downloadFile = function (fileId) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, file, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            startTime = Date.now();
                            return [4 /*yield*/, this.fileStorageAdapter.downloadFile(fileId)];
                        case 1:
                            file = _a.sent();
                            this.loggerService.logFileDownload(fileId);
                            this.metricsService.recordDownload('application/octet-stream');
                            this.loggerService.logPerformance('downloadFile', startTime);
                            return [2 /*return*/, file];
                        case 2:
                            error_2 = _a.sent();
                            this.loggerService.logError('downloadFile', error_2);
                            this.metricsService.recordError(error_2.constructor.name);
                            throw error_2;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        FileStorageDomainService_1.prototype.deleteFile = function (fileId) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            startTime = Date.now();
                            return [4 /*yield*/, this.fileStorageAdapter.deleteFile(fileId)];
                        case 1:
                            _a.sent();
                            this.loggerService.logFileDelete(fileId);
                            this.metricsService.recordDelete();
                            this.loggerService.logPerformance('deleteFile', startTime);
                            return [3 /*break*/, 3];
                        case 2:
                            error_3 = _a.sent();
                            this.loggerService.logError('deleteFile', error_3);
                            this.metricsService.recordError(error_3.constructor.name);
                            throw error_3;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        FileStorageDomainService_1.prototype.listFiles = function (prefix, bucketName) {
            return __awaiter(this, void 0, void 0, function () {
                var startTime, defaultBucketName, files, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            startTime = Date.now();
                            defaultBucketName = 'finance';
                            return [4 /*yield*/, this.fileStorageAdapter.listFiles({ prefix: prefix || '', bucketName: defaultBucketName })];
                        case 1:
                            files = _a.sent();
                            this.loggerService.logPerformance('listFiles', startTime);
                            return [2 /*return*/, files];
                        case 2:
                            error_4 = _a.sent();
                            this.loggerService.logError('listFiles', error_4);
                            this.metricsService.recordError(error_4.constructor.name);
                            throw error_4;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        return FileStorageDomainService_1;
    }());
    __setFunctionName(_classThis, "FileStorageDomainService");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        FileStorageDomainService = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return FileStorageDomainService = _classThis;
}();
exports.FileStorageDomainService = FileStorageDomainService;
