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

    /**
     * Listar todos los candidatos
     */
    public List<Candidato> listar() {
        return repo.findAll();
    }

    /**
     * Obtener un candidato por su ID (idElector)
     */
    public Candidato obtener(Long idElector) {
        return repo.findById(idElector).orElse(null);
    }

    /**
     * Crear candidato validando:
     * - Que el elector exista
     * - Que exista la relación de adscripción (votaciones.adscribe)
     */
    @Transactional
    public Candidato crear(Long idElector,
                           Integer numLista,
                           Integer codigoDane,
                           Integer codCir,
                           Integer codPartido) {

        var elector = electorRepo.findById(idElector)
                .orElseThrow(() -> new IllegalArgumentException("Elector no encontrado: " + idElector));

        var adscribeId = new AdscribeId(codigoDane, codCir, codPartido);
        var adscribe = adscribeRepo.findById(adscribeId)
                .orElseThrow(() -> new IllegalArgumentException("Adscripción no encontrada: " + adscribeId));

        var candidato = Candidato.builder()
                .idElector(idElector)
                .elector(elector)
                .numLista(numLista)
                .adscribe(adscribe)
                .build();

        return repo.save(candidato);
    }

    /**
     * Eliminar candidato por ID
     */
    @Transactional
    public void eliminar(Long idElector) {
        repo.deleteById(idElector);
    }

    /**
     * Importar candidatos desde un archivo CSV
     * CSV esperado (HEADER):
     * id_elector;num_lista;codigo_dane;cod_cir;cod_partido
     */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        var rows = csv.read(file);
        int inserted = 0;

        for (int i = 1; i < rows.size(); i++) { // Saltar encabezado
            var r = rows.get(i);
            if (r.length < 5) continue;

            try {
                crear(
                        Long.valueOf(r[0].trim()),
                        Integer.valueOf(r[1].trim()),
                        Integer.valueOf(r[2].trim()),
                        Integer.valueOf(r[3].trim()),
                        Integer.valueOf(r[4].trim())
                );
                inserted++;
            } catch (Exception e) {
                System.err.println("❌ Error en fila " + i + ": " + e.getMessage());
            }
        }

        return inserted;
    }
    @Transactional
    public Candidato guardar(Candidato candidato) {
        return repo.save(candidato);
    }
}
