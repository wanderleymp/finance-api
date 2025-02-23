"use strict";
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
exports.MinioStorageProvider = void 0;
var Minio = require("minio");
var common_1 = require("@nestjs/common");
var MinioStorageProvider = function () {
    var _classDecorators = [(0, common_1.Injectable)()];
    var _classDescriptor;
    var _classExtraInitializers = [];
    var _classThis;
    var MinioStorageProvider = _classThis = /** @class */ (function () {
        function MinioStorageProvider_1() {
            // Configurações do MinIO a partir de variáveis de ambiente
            var endpoint = process.env.MINIO_ENDPOINT || 'localhost';
            var url = new URL(endpoint.startsWith('http') ? endpoint : "https://".concat(endpoint));
            console.log('MinIO Configuration:', {
                endpoint: url.hostname,
                protocol: url.protocol,
                useSSL: process.env.MINIO_USE_SSL === 'true' || url.protocol === 'https:'
            });
            this.minioClient = new Minio.Client({
                endPoint: url.hostname,
                useSSL: process.env.MINIO_USE_SSL === 'true' || url.protocol === 'https:',
                accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
                secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin'
            });
            // Nome do bucket definido por variável de ambiente
            this.bucketName = process.env.MINIO_BUCKET_NAME || 'finance-files';
            // Criar bucket se não existir
            this.initializeBucket();
        }
        MinioStorageProvider_1.prototype.initializeBucket = function () {
            return __awaiter(this, void 0, void 0, function () {
                var bucketExists, error_1;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 4, , 5]);
                            return [4 /*yield*/, this.minioClient.bucketExists(this.bucketName)];
                        case 1:
                            bucketExists = _a.sent();
                            if (!!bucketExists) return [3 /*break*/, 3];
                            return [4 /*yield*/, this.minioClient.makeBucket(this.bucketName)];
                        case 2:
                            _a.sent();
                            console.log("Bucket ".concat(this.bucketName, " criado com sucesso"));
                            _a.label = 3;
                        case 3: return [3 /*break*/, 5];
                        case 4:
                            error_1 = _a.sent();
                            console.error('Erro ao criar/verificar bucket:', error_1);
                            // Não lance o erro para não interromper o teste
                            console.warn('Continuando sem verificar o bucket');
                            return [3 /*break*/, 5];
                        case 5: return [2 /*return*/];
                    }
                });
            });
        };
        MinioStorageProvider_1.prototype.uploadFile = function (file, metadata) {
            return __awaiter(this, void 0, void 0, function () {
                var fileName, error_2;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            _a.trys.push([0, 2, , 3]);
                            // Não adiciona timestamp para arquivos NFSe
                            fileName = metadata.fileName.includes('nfse/pdf/') ? metadata.fileName : `${Date.now()}-${metadata.fileName}`;
                            // Upload do arquivo
                            return [4 /*yield*/, this.minioClient.putObject(this.bucketName, fileName, file, file.length, {
                                    'Content-Type': metadata.contentType
                                })];
                        case 1:
                            // Upload do arquivo
                            _a.sent();
                            return [2 /*return*/, fileName];
                        case 2:
                            error_2 = _a.sent();
                            console.error('Erro no upload do arquivo:', error_2);
                            throw error_2;
                        case 3: return [2 /*return*/];
                    }
                });
            });
        };
        MinioStorageProvider_1.prototype.downloadFile = function (fileName, bucketName) {
            return __awaiter(this, void 0, void 0, function () {
                var bucket, dataStream_1, error_3;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bucket = bucketName || this.bucketName;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.minioClient.getObject(bucket, fileName)];
                        case 2:
                            dataStream_1 = _a.sent();
                            return [2 /*return*/, new Promise(function (resolve, reject) {
                                    var chunks = [];
                                    dataStream_1.on('data', function (chunk) { return chunks.push(chunk); });
                                    dataStream_1.on('end', function () { return resolve(Buffer.concat(chunks)); });
                                    dataStream_1.on('error', reject);
                                })];
                        case 3:
                            error_3 = _a.sent();
                            throw new Error("Erro ao baixar arquivo: ".concat(error_3.message));
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        MinioStorageProvider_1.prototype.deleteFile = function (fileName, bucketName) {
            return __awaiter(this, void 0, void 0, function () {
                var bucket, error_4;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            bucket = bucketName || this.bucketName;
                            _a.label = 1;
                        case 1:
                            _a.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, this.minioClient.removeObject(bucket, fileName)];
                        case 2:
                            _a.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            error_4 = _a.sent();
                            throw new Error("Erro ao deletar arquivo: ".concat(error_4.message));
                        case 4: return [2 /*return*/];
                    }
                });
            });
        };
        MinioStorageProvider_1.prototype.listFiles = function (options) {
            return __awaiter(this, void 0, void 0, function () {
                var prefix, bucketName, maxKeys, bucket, objectsStream_1;
                return __generator(this, function (_a) {
                    prefix = options.prefix, bucketName = options.bucketName, maxKeys = options.maxKeys;
                    bucket = bucketName || this.bucketName;
                    try {
                        objectsStream_1 = this.minioClient.listObjects(bucket, prefix || '', maxKeys ? true : false);
                        return [2 /*return*/, new Promise(function (resolve, reject) {
                                var files = [];
                                objectsStream_1.on('data', function (obj) {
                                    var _a;
                                    files.push({
                                        fileName: obj.name,
                                        contentType: ((_a = obj.metaData) === null || _a === void 0 ? void 0 : _a['content-type']) || 'application/octet-stream',
                                        size: obj.size,
                                        bucketName: bucket,
                                        uploadDate: obj.lastModified ? new Date(obj.lastModified) : undefined
                                    });
                                });
                                objectsStream_1.on('end', function () { return resolve(files); });
                                objectsStream_1.on('error', reject);
                            })];
                    }
                    catch (error) {
                        throw new Error("Erro ao listar arquivos: ".concat(error.message));
                    }
                    return [2 /*return*/];
                });
            });
        };
        return MinioStorageProvider_1;
    }());
    __setFunctionName(_classThis, "MinioStorageProvider");
    (function () {
        var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
        __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
        MinioStorageProvider = _classThis = _classDescriptor.value;
        if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        __runInitializers(_classThis, _classExtraInitializers);
    })();
    return MinioStorageProvider = _classThis;
}();
exports.MinioStorageProvider = MinioStorageProvider;
