package com.votaciones.domain;

import jakarta.persistence.Embeddable;
import lombok.*;

import java.io.Serializable;

@Embeddable
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@EqualsAndHashCode
public class AdscribeId implements Serializable {
    private Integer codigoDane;
    private Integer codCir;
    private Integer codPartido;
}
