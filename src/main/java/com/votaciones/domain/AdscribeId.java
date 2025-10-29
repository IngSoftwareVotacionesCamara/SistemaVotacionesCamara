package com.votaciones.domain;

import jakarta.persistence.*;
import lombok.*;
import java.io.Serializable;
import java.util.Objects;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class AdscribeId implements Serializable {

    @Column(name = "codigo_dane")
    private Integer codigoDane;

    @Column(name = "cod_cir")
    private Integer codCir;

    @Column(name = "cod_partido")
    private Integer codPartido;

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof AdscribeId that)) return false;
        return Objects.equals(codigoDane, that.codigoDane)
                && Objects.equals(codCir, that.codCir)
                && Objects.equals(codPartido, that.codPartido);
    }

    @Override
    public int hashCode() {
        return Objects.hash(codigoDane, codCir, codPartido);
    }
}