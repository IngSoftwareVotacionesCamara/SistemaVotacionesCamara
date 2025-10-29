package com.votaciones.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "electores", schema = "votaciones")
public class Elector {

    @Id
    @Column(name = "id_elector")
    private Long idElector;

    @Column(name = "nombres")
    private String nombres;

    @Column(name = "password")
    private String password;

    @Column(name = "estado")
    private String estado;

    @Column(name = "codigo_dane")
    private Integer codigoDane;

    public Long getIdElector() { return idElector; }
    public void setIdElector(Long idElector) { this.idElector = idElector; }

    public String getNombres() { return nombres; }
    public void setNombres(String nombres) { this.nombres = nombres; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Integer getCodigoDane() { return codigoDane; }
    public void setCodigoDane(Integer codigoDane) { this.codigoDane = codigoDane; }
}
