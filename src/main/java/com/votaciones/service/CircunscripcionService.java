package com.votaciones.service;


import com.votaciones.domain.Circunscripcion;
import com.votaciones.repo.CircunscripcionRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CircunscripcionService {
    private final CircunscripcionRepo repo;
    private final CsvImporter csv;

    public List<Circunscripcion> listar() { return repo.findAll(); }
    public Circunscripcion obtener(Integer codCir) { return repo.findById(codCir).orElse(null); }
    @Transactional public Circunscripcion guardar(Circunscripcion c) { return repo.save(c); }
    @Transactional public void eliminar(Integer codCir) { repo.deleteById(codCir); }

    /**
     * CSV esperado (HEADER):
     * cod_cir;nombreC;tipo;curules
     * tipo ∈ {TERRITORIAL, AFRO, INDIGENA, INTERNACIONAL}
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;
        for (int i = 1; i < rows.size(); i++) {
            var r = rows.get(i);
            if (r.length < 4) continue;
            var c = Circunscripcion.builder()
                    .codCir(Integer.valueOf(r[0].trim()))
                    .nombreC(r[1].trim())
                    .tipo(r[2].trim())
                    .curules(Integer.valueOf(r[3].trim()))
                    .build();
            repo.save(c); inserted++;
        }
        return inserted;
    }
}