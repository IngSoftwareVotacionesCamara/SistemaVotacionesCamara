package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="representacion", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Representacion {

    @EmbeddedId
    private RepresentacionId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codigoDane")
    @JoinColumn(name="codigo_dane")
    private Departamento departamento;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("codCir")
    @JoinColumn(name="cod_cir")
    private Circunscripcion circunscripcion;
}