package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "electores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Elector {
    @Id
    @Column(name = "id_elector")
    private Long idElector;

    @Column(nullable = false, length = 70)
    private String nombres;

    @Column(nullable = false, length = 20)
    private String password;

    @Column(nullable = false, length = 15)
    private String estado; // 'Habilitado' por defecto

    @ManyToOne
    @JoinColumn(name = "codigo_dane")
    private Departamento departamento;
}