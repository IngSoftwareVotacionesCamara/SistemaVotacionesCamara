package com.votaciones.repo;

import org.springframework.data.jpa.repository.JpaRepository;
import com.votaciones.domain.Circunscripcion;

public interface CircunscripcionRepo extends JpaRepository<Circunscripcion, Integer> {
}