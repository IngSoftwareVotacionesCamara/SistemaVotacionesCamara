package com.votaciones.service;


import com.votaciones.domain.*;
import com.votaciones.repo.CircunscripcionRepo;
import com.votaciones.repo.DepartamentoRepo;
import com.votaciones.repo.RepresentacionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RepresentacionService {
    private final RepresentacionRepo repo;
    private final DepartamentoRepo depRepo;
    private final CircunscripcionRepo cirRepo;
    private final CsvImporter csv;

    public List<Representacion> listar(){ return repo.findAll(); }
    public Representacion obtener(Integer codigoDane, Integer codCir){
        return repo.findById(new RepresentacionId(codigoDane, codCir)).orElse(null);
    }

    @Transactional
    public Representacion guardar(Integer codigoDane, Integer codCir){
        var dep = depRepo.findById(codigoDane).orElseThrow();
        var cir = cirRepo.findById(codCir).orElseThrow();
        var r = new Representacion();
        r.setId(new RepresentacionId(codigoDane, codCir));
        r.setDepartamento(dep);
        r.setCircunscripcion(cir);
        return repo.save(r);
    }

    @Transactional
    public void eliminar(Integer codigoDane, Integer codCir){
        repo.deleteById(new RepresentacionId(codigoDane, codCir));
    }

    /**
     * CSV esperado (HEADER):
     * codigo_dane;cod_cir
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i=1;i<rows.size();i++){
            var r = rows.get(i);
            if (r.length < 2) continue;
            guardar(Integer.valueOf(r[0].trim()), Integer.valueOf(r[1].trim()));
            inserted++;
        }
        return inserted;
    }
}