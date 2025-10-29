package com.votaciones.service;


import com.votaciones.domain.Departamento;
import com.votaciones.domain.Elector;
import com.votaciones.repo.DepartamentoRepo;
import com.votaciones.repo.ElectorRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ElectorService {
    private final ElectorRepo repo;
    private final DepartamentoRepo depRepo;
    private final CsvImporter csv;

    public List<Elector> listar(){ return repo.findAll(); }
    public Elector obtener(Long id){ return repo.findById(id).orElse(null); }
    @Transactional public Elector guardar(Elector e){ return repo.save(e); }
    @Transactional public void eliminar(Long id){ repo.deleteById(id); }

    /**
     * CSV esperado (HEADER):
     * id_elector;nombres;password;estado;codigo_dane
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i=1;i<rows.size();i++){
            var r = rows.get(i);
            if (r.length < 5) continue;
            Departamento d = null;
            if (!r[4].isBlank()) d = depRepo.findById(Integer.valueOf(r[4].trim())).orElse(null);

            var e = Elector.builder()
                    .idElector(Long.valueOf(r[0].trim()))
                    .nombres(r[1].trim())
                    .password(r[2].trim())
                    .estado(r[3].isBlank()? "Habilitado": r[3].trim())
                    .departamento(d)
                    .build();
            repo.save(e); inserted++;
        }
        return inserted;
    }
}