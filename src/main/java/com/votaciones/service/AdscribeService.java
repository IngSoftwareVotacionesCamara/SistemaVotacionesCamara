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
public class AdscribeService {
    private final AdscribeRepo repo;
    private final RepresentacionRepo repRepo;
    private final PartidoRepo partidoRepo;
    private final CsvImporter csv;

    public List<Adscribe> listar(){ return repo.findAll(); }
    public Adscribe obtener(Integer codigoDane, Integer codCir, Integer codPartido){
        return repo.findById(new AdscribeId(codigoDane, codCir, codPartido)).orElse(null);
    }

    @Transactional
    public Adscribe guardar(Integer codigoDane, Integer codCir, Integer codPartido, String tipoLista){
        // verifica existan representacion (dpto+cir) y partido
        repRepo.findById(new RepresentacionId(codigoDane, codCir)).orElseThrow();
        partidoRepo.findById(codPartido).orElseThrow();

        var a = new Adscribe();
        a.setId(new AdscribeId(codigoDane, codCir, codPartido));
        a.setTipoLista(tipoLista);
        return repo.save(a);
    }

    @Transactional
    public void eliminar(Integer codigoDane, Integer codCir, Integer codPartido){
        repo.deleteById(new AdscribeId(codigoDane, codCir, codPartido));
    }

    /**
     * CSV esperado (HEADER):
     * codigo_dane;cod_cir;cod_partido;tipo_lista
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i=1;i<rows.size();i++){
            var r = rows.get(i);
            if (r.length < 4) continue;
            guardar(
                    Integer.valueOf(r[0].trim()),
                    Integer.valueOf(r[1].trim()),
                    Integer.valueOf(r[2].trim()),
                    r[3].trim()
            );
            inserted++;
        }
        return inserted;
    }
}