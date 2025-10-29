package com.votaciones.repo;

import com.votaciones.domain.Representacion;
import com.votaciones.domain.RepresentacionId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RepresentacionRepo extends JpaRepository<Representacion, RepresentacionId> {}
