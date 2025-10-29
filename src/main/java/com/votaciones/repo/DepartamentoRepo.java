package com.votaciones.repo;

import com.votaciones.domain.Departamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DepartamentoRepo extends JpaRepository<Departamento, Integer> {

}