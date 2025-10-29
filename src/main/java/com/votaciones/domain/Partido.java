package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "partidos", schema = "votaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Partido {

    @Id
    @Column(name = "cod_partido", nullable = false)
    private Integer codPartido;

    @Column(name = "nombreP", length = 40, nullable = false)
    private String nombreP;
}
