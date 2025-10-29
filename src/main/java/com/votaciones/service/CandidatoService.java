package com.votaciones.service;

import com.votaciones.domain.*;
import com.votaciones.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CandidatoService {
    private final CandidatoRepo repo;
    private final ElectorRepo electorRepo;
    private final AdscribeRepo adscribeRepo;
    private final CsvImporter csv;

    public List<Candidato> listar(){ return repo.findAll(); }
    public Candidato obtener(Long idElector){ return repo.findById(idElector).orElse(null); }

    /**
     * Crea candidato validando:
     * - existe elector
     * - existe adscribe (codigo_dane, cod_cir, cod_partido)
     */
    @Transactional
    public Candidato crear(Long idElector, Integer numLista, Integer codigoDane, Integer codCir, Integer codPartido){
        var elector = electorRepo.findById(idElector).orElseThrow();
        var adscribe = adscribeRepo.findById(new AdscribeId(codigoDane, codCir, codPartido)).orElseThrow();

        var c = Candidato.builder()
                .idElector(idElector)
                .elector(elector)
                .numLista(numLista)
                .adscribe(adscribe)
                .build();
        return repo.save(c);
    }

    @Transactional public void eliminar(Long idElector){ repo.deleteById(idElector); }

    /**
     * CSV esperado (HEADER):
     * id_elector;num_lista;codigo_dane;cod_cir;cod_partido
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i=1;i<rows.size();i++){
            var r = rows.get(i);
            if (r.length < 5) continue;
            crear(
                    Long.valueOf(r[0].trim()),
                    Integer.valueOf(r[1].trim()),
                    Integer.valueOf(r[2].trim()),
                    Integer.valueOf(r[3].trim()),
                    Integer.valueOf(r[4].trim())
            );
            inserted++;
        }
        return inserted;
    }
}