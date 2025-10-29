package com.votaciones.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.*;

@Embeddable
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class RepresentacionId {
    @Column(name = "codigo_dane")
    private Integer codigoDane;

    @Column(name = "cod_cir")
    private Integer codCir;
}
