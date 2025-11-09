

--  Creación de esquema

CREATE SCHEMA votaciones;


--  Creación de Tablas

CREATE TABLE votaciones.departamentos
(
   codigo_dane int CONSTRAINT pk_departamentos PRIMARY KEY, 
   nombre character varying(20) NOT NULL
);

CREATE TABLE votaciones.electores
(
   id_elector bigint CONSTRAINT pk_electores PRIMARY KEY, 
   nombres character varying(70) NOT NULL, 
   password character varying(20) NOT NULL,
   estado character varying(15) NOT NULL DEFAULT 'Habilitado', 
   codigo_dane int,
   CONSTRAINT fk_electores FOREIGN KEY (codigo_dane) REFERENCES departamentos (codigo_dane)
);

CREATE TABLE votaciones.circunscripciones
(
   cod_cir int CONSTRAINT pk_circunscripcion PRIMARY KEY, 
   nombreC character varying(30) NOT NULL, 
   tipo character varying(15) NOT NULL, 
   curules int NOT NULL CHECK (curules >= 0)
);

CREATE TABLE votaciones.representacion
(
   codigo_dane int, 
   cod_cir int,
   CONSTRAINT pk_representacion PRIMARY KEY (codigo_dane,cod_cir),
   CONSTRAINT fk_representacion1 FOREIGN KEY (codigo_dane) REFERENCES departamentos (codigo_dane),
   CONSTRAINT fk_representacion2 FOREIGN KEY (cod_cir) REFERENCES circunscripciones (cod_cir)
);

CREATE TABLE votaciones.partidos
(
   cod_partido int CONSTRAINT pk_partidos PRIMARY KEY, 
   nombreP character varying(40) NOT NULL
);

CREATE TABLE votaciones.adscribe
(
   codigo_dane int, 
   cod_cir int, 
   cod_partido int,
   tipo_lista character varying(10) NOT NULL,
   CONSTRAINT pk_adscribe PRIMARY KEY (codigo_dane,cod_cir,cod_partido),
   CONSTRAINT fk_adscribe1 FOREIGN KEY (codigo_dane,cod_cir) REFERENCES representacion (codigo_dane,cod_cir),
   CONSTRAINT fk_adscribe2 FOREIGN KEY (cod_partido) REFERENCES partidos (cod_partido)
);

CREATE TABLE votaciones.candidatos
(
   id_elector bigint CONSTRAINT pk_candidatos PRIMARY KEY, 
   num_lista int NOT NULL CHECK (num_lista > 0), 
   cod_partido int, 
   codigo_dane int, 
   cod_cir int,
   CONSTRAINT fk_candidatos1 FOREIGN KEY (id_elector) REFERENCES electores (id_elector),
   CONSTRAINT fk_candidatos2 FOREIGN KEY (codigo_dane,cod_cir,cod_partido) REFERENCES adscribe (codigo_dane,cod_cir,cod_partido)
);

CREATE TABLE votaciones.elige
(
   cod_elige int CONSTRAINT pk_elige PRIMARY KEY, 
   id_elector bigint,
   CONSTRAINT fk_elige FOREIGN KEY (id_elector) REFERENCES candidatos (id_elector)
);

CREATE TABLE votaciones.vota
(
   cod_vota int CONSTRAINT pk_vota PRIMARY KEY, 
   cod_partido int, 
   codigo_dane int, 
   cod_cir int,
   CONSTRAINT fk_vota FOREIGN KEY (codigo_dane,cod_cir,cod_partido) REFERENCES adscribe (codigo_dane,cod_cir,cod_partido)
);
