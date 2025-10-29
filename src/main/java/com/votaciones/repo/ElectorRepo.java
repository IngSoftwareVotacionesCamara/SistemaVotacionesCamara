package com.votaciones.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.votaciones.domain.Elector;

public interface ElectorRepo extends JpaRepository<Elector, Long>{
}
