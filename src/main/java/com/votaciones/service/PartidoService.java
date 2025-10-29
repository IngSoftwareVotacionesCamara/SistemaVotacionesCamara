package com.votaciones.service;


import com.votaciones.domain.Partido;
import com.votaciones.repo.PartidoRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PartidoService {
    private final PartidoRepo repo;
    private final CsvImporter csv;

    public List<Partido> listar(){ return repo.findAll(); }
    public Partido obtener(Integer cod){ return repo.findById(cod).orElse(null); }
    @Transactional public Partido guardar(Partido p){ return repo.save(p); }
    @Transactional public void eliminar(Integer cod){ repo.deleteById(cod); }

    /**
     * CSV esperado (HEADER):
     * cod_partido;nombreP
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i=1;i<rows.size();i++){
            var r = rows.get(i);
            if (r.length < 2) continue;
            var p = Partido.builder()
                    .codPartido(Integer.valueOf(r[0].trim()))
                    .nombreP(r[1].trim())
                    .build();
            repo.save(p); inserted++;
        }
        return inserted;
    }
}