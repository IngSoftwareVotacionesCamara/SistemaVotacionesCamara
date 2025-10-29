package com.votaciones.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class RepresentacionId implements Serializable {
    private Integer codigoDane;
    private Integer codCir;
}