package com.votaciones.service;


import com.votaciones.domain.Candidato;
import com.votaciones.domain.Elige;
import com.votaciones.repo.CandidatoRepo;
import com.votaciones.repo.EligeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EligeService {
    private final EligeRepo repo;
    private final CandidatoRepo candidatoRepo;

    public List<Elige> listar(){ return repo.findAll(); }
    public Elige obtener(Integer codElige){ return repo.findById(codElige).orElse(null); }

    @Transactional
    public Elige crear(Integer codElige, Long idElectorCandidato){
        Candidato cand = candidatoRepo.findById(idElectorCandidato).orElseThrow();
        var e = Elige.builder().codElige(codElige).candidato(cand).build();
        return repo.save(e);
    }

    @Transactional public void eliminar(Integer codElige){ repo.deleteById(codElige); }
}