package com.votaciones.repo;

import com.votaciones.domain.Candidato;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CandidatoRepo extends JpaRepository<Candidato,Long> {
}
