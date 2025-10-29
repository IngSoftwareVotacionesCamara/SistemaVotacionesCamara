package com.votaciones.domain;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "elige")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Elige {
    @Id
    @Column(name = "cod_elige")
    private Integer codElige;

    @ManyToOne
    @JoinColumn(name = "id_elector")
    private Candidato candidato;
}