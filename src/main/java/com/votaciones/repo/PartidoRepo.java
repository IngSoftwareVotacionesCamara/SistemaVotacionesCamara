package com.votaciones.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.votaciones.domain.Partido;

public interface PartidoRepo extends JpaRepository<Partido, Integer> {
}
