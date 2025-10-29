package com.votaciones.repo;

import com.votaciones.domain.Adscribe;
import com.votaciones.domain.AdscribeId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdscribeRepo extends JpaRepository<Adscribe, AdscribeId> {

}