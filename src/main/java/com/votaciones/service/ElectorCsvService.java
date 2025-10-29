package com.votaciones.service;

import com.opencsv.CSVReader;
import com.votaciones.entity.Elector;
import com.votaciones.repo.ElectorRepo;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
public class ElectorCsvService {

    private final ElectorRepo electorRepository;

    public ElectorCsvService(ElectorRepo electorRepository) {
        this.electorRepository = electorRepository;
    }

    public int importar(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Adjunta un archivo CSV");
        }

        List<Elector> toSave = new ArrayList<>();
        try (CSVReader reader =
                     new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String[] header = reader.readNext();
            if (header == null) throw new IllegalArgumentException("CSV sin encabezado");

            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < header.length; i++) {
                idx.put(header[i].trim().toLowerCase(), i);
            }

            String[] need = {"id_elector", "nombres", "password", "estado", "codigo_dane"};
            for (String n : need) if (!idx.containsKey(n)) {
                throw new IllegalArgumentException("Falta columna: " + n);
            }

            String[] row;
            while ((row = reader.readNext()) != null) {
                if (row.length == 0) continue;
                Elector e = new Elector();
                e.setIdElector(Long.parseLong(row[idx.get("id_elector")].trim()));
                e.setNombres(row[idx.get("nombres")].trim());
                e.setPassword(row[idx.get("password")].trim());
                String estado = row[idx.get("estado")].trim();
                e.setEstado(estado.isEmpty() ? "Habilitado" : estado);
                e.setCodigoDane(Integer.parseInt(row[idx.get("codigo_dane")].trim()));
                toSave.add(e);
            }
        }
        electorRepository.saveAll(toSave);
        return toSave.size();
    }
}
