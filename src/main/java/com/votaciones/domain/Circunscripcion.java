package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="circunscripciones", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Circunscripcion {
    @Id
    @Column(name="cod_cir")
    private Integer codCir;

    @Column(name="nombreC", length=30, nullable=false)
    private String nombreC;

    @Column(name="tipo", length=15, nullable=false)
    private String tipo;

    @Column(name="curules", nullable=false)
    private Integer curules;
}