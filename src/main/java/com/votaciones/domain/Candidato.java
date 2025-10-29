package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "candidatos", schema = "votaciones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Candidato {

    @Id
    @Column(name = "id_elector")
    private Long idElector;

    // Relación uno a uno con elector (misma PK)
    @OneToOne(fetch = FetchType.LAZY)
    @MapsId // indica que comparte la misma PK
    @JoinColumn(name = "id_elector", referencedColumnName = "id_elector")
    private Elector elector;

    @Column(name = "num_lista", nullable = false)
    private Integer numLista;

    // Relación muchos-a-uno hacia adscribe (departamento + circunscripción + partido)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "codigo_dane", referencedColumnName = "codigo_dane"),
            @JoinColumn(name = "cod_cir", referencedColumnName = "cod_cir"),
            @JoinColumn(name = "cod_partido", referencedColumnName = "cod_partido")
    })
    private Adscribe adscribe;
}
