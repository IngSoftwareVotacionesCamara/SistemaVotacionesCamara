package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="candidatos", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Candidato {

    @Id
    @Column(name="id_elector")
    private Long idElector;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id_elector", insertable=false, updatable=false)
    private Elector elector;

    @Column(name="num_lista", nullable=false)
    private Integer numLista;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name="codigo_dane", referencedColumnName="codigo_dane"),
            @JoinColumn(name="cod_cir", referencedColumnName="cod_cir"),
            @JoinColumn(name="cod_partido", referencedColumnName="cod_partido")
    })
    private Adscribe adscribe;
}