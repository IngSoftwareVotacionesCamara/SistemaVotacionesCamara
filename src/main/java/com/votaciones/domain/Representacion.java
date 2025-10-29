package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "representacion")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Representacion {

    @EmbeddedId
    private RepresentacionId id;

    @MapsId("codigoDane")
    @ManyToOne
    @JoinColumn(name = "codigo_dane")
    private Departamento departamento;

    @MapsId("codCir")
    @ManyToOne
    @JoinColumn(name = "cod_cir")
    private Circunscripcion circunscripcion;
}