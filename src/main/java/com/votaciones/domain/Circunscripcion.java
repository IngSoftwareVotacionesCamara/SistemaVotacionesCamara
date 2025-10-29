package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "circunscripciones")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Circunscripcion {
    @Id
    @Column(name = "cod_cir")
    private Integer codCir;

    @Column(name = "nombreC", nullable = false, length = 30)
    private String nombreC;

    @Column(name = "tipo", nullable = false, length = 15)
    private String tipo;

    @Column(name = "curules", nullable = false)
    private Integer curules;
}