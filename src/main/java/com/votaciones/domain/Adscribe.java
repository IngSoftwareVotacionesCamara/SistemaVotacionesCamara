package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "adscribe", schema = "votaciones")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class Adscribe {

    @EmbeddedId
    private AdscribeId id;

    // FK (codigo_dane, cod_cir) -> representacion(codigo_dane, cod_cir)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumns({
            @JoinColumn(name = "codigo_dane", referencedColumnName = "codigo_dane", insertable = false, updatable = false),
            @JoinColumn(name = "cod_cir", referencedColumnName = "cod_cir", insertable = false, updatable = false)
    })
    private Representacion representacion;

    // FK (cod_partido) -> partidos(cod_partido)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cod_partido", referencedColumnName = "cod_partido", insertable = false, updatable = false)
    private Partido partido;

    @Column(name = "tipo_lista", length = 10, nullable = false)
    private String tipoLista;
}