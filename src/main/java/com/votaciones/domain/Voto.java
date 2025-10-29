package com.votaciones.domain;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="vota", schema="votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Voto {
    @Id
    @Column(name="cod_vota")
    private Integer codVota;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name="codigo_dane", referencedColumnName="codigo_dane"),
            @JoinColumn(name="cod_cir", referencedColumnName="cod_cir"),
            @JoinColumn(name="cod_partido", referencedColumnName="cod_partido")
    })
    private Adscribe adscribe;
}