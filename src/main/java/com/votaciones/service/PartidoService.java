package com.votaciones.service;

import com.votaciones.domain.Partido;
import com.votaciones.repo.PartidoRepo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class PartidoService {

    private final PartidoRepo repo;
    private final CsvImporter csv; // Asumo que ya lo tienes como @Component con método read(MultipartFile)

    /* =========================
       Consultas (read-only)
       ========================= */
    @Transactional(readOnly = true)
    public List<Partido> listar() {
        return repo.findAll();
    }

    @Transactional(readOnly = true)
    public Partido obtener(Integer cod) {
        if (cod == null) return null;
        return repo.findById(cod).orElse(null);
    }

    // Overload para encajar con controladores que reciban Long
    @Transactional(readOnly = true)
    public Partido obtener(Long id) {
        return (id == null) ? null : obtener(safeInt(id));
    }

    /* =========================
       Escrituras
       ========================= */
    @Transactional
    public Partido guardar(Partido p) {
        Objects.requireNonNull(p, "Partido no puede ser null");
        Objects.requireNonNull(p.getCodPartido(), "codPartido es obligatorio");
        return repo.save(p);
    }

    /** Actualiza asegurando que el id de la URL prevalezca */
    @Transactional
    public Partido actualizar(Integer cod, Partido data) {
        Objects.requireNonNull(cod, "codPartido es obligatorio");
        Objects.requireNonNull(data, "Partido no puede ser null");
        data.setCodPartido(cod);
        return repo.save(data); // save actúa como upsert en JPA
    }

    @Transactional
    public Partido actualizar(Long id, Partido data) {
        return actualizar(safeInt(id), data);
    }

    @Transactional
    public void eliminar(Integer cod) {
        if (cod == null) return;
        repo.deleteById(cod);
    }

    @Transactional
    public void eliminar(Long id) {
        if (id == null) return;
        eliminar(safeInt(id));
    }

    /* =========================
       Importación CSV
       CSV esperado (HEADER):
       cod_partido;nombreP
       ========================= */
    @Transactional
    public int importarCsv(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo CSV está vacío.");
        }

        // Si tu CsvImporter ya hace el split, perfecto; si no, aquí tienes el hook.
        // csv.read(file) debe devolver List<String[]> sin BOM y con separación por ';'.
        var rows = csv.read(file);

        int inserted = 0;
        for (int i = 1; i < rows.size(); i++) { // saltar encabezado
            var r = rows.get(i);
            if (r == null || r.length < 2) continue;

            String codStr = trimOrNull(r[0]);
            String nombre = trimOrNull(r[1]);

            if (codStr == null || nombre == null || codStr.isEmpty() || nombre.isEmpty()) {
                continue; // fila incompleta
            }

            Integer cod;
            try {
                cod = Integer.valueOf(codStr);
            } catch (NumberFormatException e) {
                // fila con id inválido → saltar
                continue;
            }

            // upsert: si ya existe, actualiza nombre; si no, crea
            var existente = repo.findById(cod).orElse(null);
            if (existente == null) {
                var nuevo = Partido.builder()
                        .codPartido(cod)
                        .nombreP(nombre)
                        .build();
                repo.save(nuevo);
                inserted++;
            } else {
                // Solo actualiza si cambia el nombre para evitar escrituras innecesarias
                if (!nombre.equals(existente.getNombreP())) {
                    existente.setNombreP(nombre);
                    repo.save(existente);
                }
            }
        }
        return inserted;
    }

    /* =========================
       Helpers
       ========================= */
    private static Integer safeInt(Long id) {
        if (id == null) return null;
        if (id > Integer.MAX_VALUE || id < Integer.MIN_VALUE) {
            throw new IllegalArgumentException("El id excede el rango de Integer: " + id);
        }
        return id.intValue();
    }

    private static String trimOrNull(String s) {
        if (s == null) return null;
        var t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
