package com.votaciones.domain;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="elige", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Elige {
    @Id
    @Column(name="cod_elige")
    private Integer codElige;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id_elector")
    private Candidato candidato;
}