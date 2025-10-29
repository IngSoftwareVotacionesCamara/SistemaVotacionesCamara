package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "adscribe")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Adscribe {

    @EmbeddedId
    private AdscribeId id;

    // Relación con representacion (codigo_dane, cod_cir)
    @MapsId("codigoDane")
    @ManyToOne @JoinColumn(name = "codigo_dane", insertable = false, updatable = false)
    private Departamento departamento;

    @MapsId("codCir")
    @ManyToOne @JoinColumn(name = "cod_cir", insertable = false, updatable = false)
    private Circunscripcion circunscripcion;

    @MapsId("codPartido")
    @ManyToOne @JoinColumn(name = "cod_partido", insertable = false, updatable = false)
    private Partido partido;

    @Column(name = "tipo_lista", nullable = false, length = 10)
    private String tipoLista;
}