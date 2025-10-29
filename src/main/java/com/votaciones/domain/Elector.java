package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="electores", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Elector {
    @Id
    @Column(name="id_elector")
    private Long idElector;

    @Column(name="nombres", length=70, nullable=false)
    private String nombres;

    @Column(name="password", length=20, nullable=false)
    private String password;

    @Column(name="estado", length=15, nullable=false)
    private String estado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="codigo_dane")
    private Departamento departamento;   // nullable
}