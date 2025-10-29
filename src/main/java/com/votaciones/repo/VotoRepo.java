package com.votaciones.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.votaciones.domain.Voto;

public interface VotoRepo extends JpaRepository<Voto, Integer> {
}
