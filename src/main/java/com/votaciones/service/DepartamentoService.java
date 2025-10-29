package com.votaciones.service;


import com.votaciones.domain.Departamento;
import com.votaciones.repo.DepartamentoRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DepartamentoService {
    private final DepartamentoRepo repo;
    private final CsvImporter csv;

    public List<Departamento> listar() { return repo.findAll(); }
    public Departamento obtener(Integer codigoDane) { return repo.findById(codigoDane).orElse(null); }
    @Transactional public Departamento guardar(Departamento d) { return repo.save(d); }
    @Transactional public void eliminar(Integer codigoDane) { repo.deleteById(codigoDane); }

    /**
     * CSV esperado (HEADER):
     * codigo_dane;nombre
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i = 1; i < rows.size(); i++) {
            var r = rows.get(i);
            if (r.length < 2) continue;
            var dep = new Departamento(Integer.valueOf(r[0].trim()), r[1].trim());
            repo.save(dep); inserted++;
        }
        return inserted;
    }
}