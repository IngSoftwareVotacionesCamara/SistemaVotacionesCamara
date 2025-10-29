package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "partidos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Partido {
    @Id
    @Column(name = "cod_partido")
    private Integer codPartido;

    @Column(name = "nombreP", nullable = false, length = 40)
    private String nombreP;
}