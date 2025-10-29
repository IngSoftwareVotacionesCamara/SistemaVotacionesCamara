package com.votaciones.service;

import com.opencsv.CSVReader;
import com.opencsv.bean.HeaderColumnNameTranslateMappingStrategy;
import com.opencsv.bean.StatefulBeanToCsv;
import com.votaciones.entity.Elector;
import com.votaciones.repo.ElectorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ElectorCsvService {

    private final ElectorRepository electorRepository;

    public int importar(MultipartFile file) throws Exception {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Adjunta un archivo CSV");

        List<Elector> toSave = new ArrayList<>();
        try (CSVReader reader = new CSVReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String[] header = reader.readNext(); // lee encabezado
            if (header == null) throw new IllegalArgumentException("CSV sin encabezado");

            Map<String, Integer> idx = new HashMap<>();
            for (int i = 0; i < header.length; i++) idx.put(header[i].trim().toLowerCase(), i);

            // columnas esperadas
            String[] req = {"id_elector","nombres","password","estado","codigo_dane"};
            for (String r : req)
                if (!idx.containsKey(r)) throw new IllegalArgumentException("Falta columna: " + r);

            String[] row;
            while ((row = reader.readNext()) != null) {
                if (row.length == 0) continue;
                Elector e = new Elector();
                e.setIdElector(Long.parseLong(row[idx.get("id_elector")].trim()));
                e.setNombres(row[idx.get("nombres")].trim());
                e.setPassword(row[idx.get("password")].trim());
                e.setEstado(row[idx.get("estado")].isBlank() ? "Habilitado" : row[idx.get("estado")].trim());
                e.setCodigoDane(Integer.parseInt(row[idx.get("codigo_dane")].trim()));
                toSave.add(e);
            }
        }
        electorRepository.saveAll(toSave);
        return toSave.size();
    }
}