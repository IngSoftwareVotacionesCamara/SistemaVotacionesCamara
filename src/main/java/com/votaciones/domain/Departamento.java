package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="departamentos", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Departamento {
    @Id
    @Column(name="codigo_dane")
    private Integer codigoDane;

    @Column(name="nombre", length=20, nullable=false)
    private String nombre;
}