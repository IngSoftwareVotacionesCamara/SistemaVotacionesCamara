package com.votaciones.service;


import com.votaciones.domain.Voto;
import com.votaciones.repo.VotoRepo;
import jakarta.transaction.Transactional;
import com.votaciones.domain.Adscribe;
import com.votaciones.domain.AdscribeId;
import com.votaciones.repo.AdscribeRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VotoService {
    private final VotoRepo repo;
    private final AdscribeRepo adscribeRepo;

    public List<Voto> listar(){ return repo.findAll(); }
    public Voto obtener(Integer codVota){ return repo.findById(codVota).orElse(null); }

    @Transactional
    public Voto registrar(Integer codVota, Integer codigoDane, Integer codCir, Integer codPartido){
        Adscribe a = adscribeRepo.findById(new AdscribeId(codigoDane, codCir, codPartido)).orElseThrow();
        var v = Voto.builder().codVota(codVota).adscribe(a).build();
        return repo.save(v);
    }

    @Transactional public void eliminar(Integer codVota){ repo.deleteById(codVota); }
}