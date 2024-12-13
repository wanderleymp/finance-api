-- Schema Base do Sistema Finance API
-- Este arquivo contém a estrutura base completa do banco de dados
-- Usado apenas para criar um novo banco do zero

-- Configurações Iniciais
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enums
CREATE TYPE document_type_enum AS ENUM ('CPF', 'CNPJ', 'RG', 'CNH', 'OUTROS');

-- Tabela de Configuração do Sistema
CREATE TABLE system_config (
    config_id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Controle de Migrações
CREATE TABLE migrations (
    migration_id SERIAL PRIMARY KEY,
    migration_name VARCHAR(255) NOT NULL,
    db_version VARCHAR(20) NOT NULL,
    applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    description TEXT
);

-- Tabela de Pessoas
CREATE TABLE persons (
    person_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    fantasy_name VARCHAR(255),
    person_type CHAR(1) NOT NULL CHECK (person_type IN ('F', 'J')),
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Documentos de Pessoas
CREATE TABLE person_documents (
    person_document_id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL,
    document_type document_type_enum NOT NULL,
    document_value VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_person FOREIGN KEY (person_id)
        REFERENCES persons (person_id) ON DELETE CASCADE
);

-- Índices
CREATE UNIQUE INDEX person_documents_unique_idx
ON person_documents (person_id, document_type, document_value);

CREATE INDEX persons_full_name_idx ON persons (full_name);
CREATE INDEX persons_person_type_idx ON persons (person_type);
CREATE INDEX persons_active_idx ON persons (active);

-- Inserir Configuração Inicial do Sistema
INSERT INTO system_config (key, value, description)
VALUES 
    ('db_version', '1.0.0.5', 'Versão atual do banco de dados'),
    ('system_name', 'Finance API', 'Nome do sistema'),
    ('created_at', CURRENT_TIMESTAMP, 'Data de criação do banco');

-- Registrar Migração Inicial
INSERT INTO migrations (migration_name, db_version, description)
VALUES ('base_schema.sql', '1.0.0.5', 'Schema base inicial do sistema');
