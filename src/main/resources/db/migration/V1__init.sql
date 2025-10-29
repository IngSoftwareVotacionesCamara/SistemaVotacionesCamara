-- Esquema
CREATE SCHEMA IF NOT EXISTS votaciones;

-- Tablas
CREATE TABLE IF NOT EXISTS votaciones.departamentos
(
   codigo_dane INT PRIMARY KEY,
   nombre VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS votaciones.electores
(
   id_elector BIGINT PRIMARY KEY,
   nombres VARCHAR(70) NOT NULL,
   password VARCHAR(20) NOT NULL,
   estado VARCHAR(15) NOT NULL DEFAULT 'Habilitado',
   codigo_dane INT,
   CONSTRAINT fk_electores
     FOREIGN KEY (codigo_dane)
     REFERENCES votaciones.departamentos (codigo_dane)
);

CREATE TABLE IF NOT EXISTS votaciones.circunscripciones
(
   cod_cir INT PRIMARY KEY,
   nombreC VARCHAR(30) NOT NULL,
   tipo VARCHAR(15) NOT NULL,
   curules INT NOT NULL CHECK (curules >= 0)
);

CREATE TABLE IF NOT EXISTS votaciones.representacion
(
   codigo_dane INT,
   cod_cir INT,
   PRIMARY KEY (codigo_dane, cod_cir),
   CONSTRAINT fk_representacion1
     FOREIGN KEY (codigo_dane) REFERENCES votaciones.departamentos (codigo_dane),
   CONSTRAINT fk_representacion2
     FOREIGN KEY (cod_cir)     REFERENCES votaciones.circunscripciones (cod_cir)
);

CREATE TABLE IF NOT EXISTS votaciones.partidos
(
   cod_partido INT PRIMARY KEY,
   nombreP VARCHAR(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS votaciones.adscribe
(
   codigo_dane INT,
   cod_cir INT,
   cod_partido INT,
   tipo_lista VARCHAR(10) NOT NULL,
   PRIMARY KEY (codigo_dane, cod_cir, cod_partido),
   CONSTRAINT fk_adscribe1
     FOREIGN KEY (codigo_dane, cod_cir)
     REFERENCES votaciones.representacion (codigo_dane, cod_cir),
   CONSTRAINT fk_adscribe2
     FOREIGN KEY (cod_partido)
     REFERENCES votaciones.partidos (cod_partido)
);

CREATE TABLE IF NOT EXISTS votaciones.candidatos
(
   id_elector BIGINT PRIMARY KEY,
   num_lista INT NOT NULL CHECK (num_lista > 0),
   cod_partido INT,
   codigo_dane INT,
   cod_cir INT,
   CONSTRAINT fk_candidatos1
     FOREIGN KEY (id_elector)
     REFERENCES votaciones.electores (id_elector),
   CONSTRAINT fk_candidatos2
     FOREIGN KEY (codigo_dane, cod_cir, cod_partido)
     REFERENCES votaciones.adscribe (codigo_dane, cod_cir, cod_partido)
);

CREATE TABLE IF NOT EXISTS votaciones.elige
(
   cod_elige INT PRIMARY KEY,
   id_elector BIGINT,
   CONSTRAINT fk_elige
     FOREIGN KEY (id_elector)
     REFERENCES votaciones.candidatos (id_elector)
);

CREATE TABLE IF NOT EXISTS votaciones.vota
(
   cod_vota INT PRIMARY KEY,
   cod_partido INT,
   codigo_dane INT,
   cod_cir INT,
   CONSTRAINT fk_vota
     FOREIGN KEY (codigo_dane, cod_cir, cod_partido)
     REFERENCES votaciones.adscribe (codigo_dane, cod_cir, cod_partido)
);
