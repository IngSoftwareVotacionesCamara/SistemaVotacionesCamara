package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "departamentos")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Departamento {
    @Id
    @Column(name = "codigo_dane")
    private Integer codigoDane;

    @Column(name = "nombre", nullable = false, length = 20)
    private String nombre;
}