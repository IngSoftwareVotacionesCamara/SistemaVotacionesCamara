package com.votaciones.domain;


import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(schema = "votaciones", name = "vota")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Voto {
    @Id
    @Column(name = "cod_vota")
    private Integer codVota;

    @ManyToOne
    @JoinColumns({
            @JoinColumn(name = "codigo_dane", referencedColumnName = "codigo_dane"),
            @JoinColumn(name = "cod_cir",     referencedColumnName = "cod_cir"),
            @JoinColumn(name = "cod_partido", referencedColumnName = "cod_partido")
    })
    private Adscribe adscribe;
}